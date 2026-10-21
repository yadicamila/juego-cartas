/**
 * Lógica pura del juego de memoria "Encuentra las parejas".
 *
 * Reglas de este módulo:
 * - No importa nada de React ni del DOM (es JavaScript puro y testeable).
 * - Todas las funciones son puras: reciben estado y devuelven un estado nuevo,
 *   sin mutar los objetos recibidos.
 * - El azar siempre es inyectable (parámetro `rng`) para poder escribir
 *   pruebas deterministas.
 */

/** Figuras disponibles (emojis de Twemoji). */
export const FRUTAS = [
  'manzana',
  'banano',
  'uvas',
  'fresa',
  'sandia',
  'naranja',
  'pina',
  'cereza',
  'aguacate',
  'zanahoria',
  'maiz',
  'limon',
] as const

export type Fruta = (typeof FRUTAS)[number]

/** Número de parejas por partida (tablero 4x3 = 12 cartas = 6 parejas). */
export const PAREJAS_POR_PARTIDA = 6

/** Milisegundos que permanecen reveladas dos cartas que no coinciden. */
export const MS_ESPERA_OCULTAR = 1000

export type EstadoCarta = 'oculta' | 'revelada' | 'emparejada'

export type Fase = 'jugando' | 'evaluando' | 'ganado'

export interface Carta {
  /** Identificador estable dentro de la partida. */
  id: string
  /** Figura representada por la carta. */
  figura: Fruta
  /** Estado visual/lógico de la carta. */
  estado: EstadoCarta
}

/** Última jugada resuelta; se usa para anunciar mensajes accesibles. */
export type Evento =
  | { tipo: 'pareja'; figura: Fruta; parejasEncontradas: number; intentos: number }
  | { tipo: 'no-pareja'; figuras: readonly [Fruta, Fruta]; intentos: number }
  | { tipo: 'victoria'; intentos: number; parejasEncontradas: number }

export interface EstadoJuego {
  /** Las 12 cartas del tablero, en orden fijo. */
  cartas: Carta[]
  /** Número de jugadas completas (dos cartas reveladas). */
  intentos: number
  /** Parejas ya encontradas y visibles. */
  parejasEncontradas: number
  /** Cartas reveladas en la jugada actual (ids). */
  seleccion: readonly [string | null, string | null]
  /** Fase de la partida. */
  fase: Fase
  /** Resultado de la última jugada evaluada. */
  evento: Evento | null
}

/* -------------------------------------------------------------------------- */
/* Azar inyectable                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Generador pseudoaleatorio determinista (mulberry32).
 * Con la misma semilla produce siempre la misma secuencia.
 */
export function crearRng(semilla: number): () => number {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Mezcla (Fisher-Yates) sin mutar el array original.
 * @param rng generador de números en [0, 1).
 */
export function mezclar<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const resultado = [...items]
  for (let i = resultado.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)))
    const a = resultado[i] as T
    const b = resultado[j] as T
    resultado[i] = b
    resultado[j] = a
  }
  return resultado
}

/**
 * Elige `cantidad` figuras distintas al azar entre las disponibles.
 */
export function elegirFiguras(
  rng: () => number = Math.random,
  todas: readonly Fruta[] = FRUTAS,
  cantidad: number = PAREJAS_POR_PARTIDA,
): Fruta[] {
  if (cantidad < 0) {
    throw new Error('La cantidad de figuras no puede ser negativa.')
  }
  if (cantidad > todas.length) {
    throw new Error(
      `No se pueden elegir ${cantidad} figuras distintas: solo hay ${todas.length} disponibles.`,
    )
  }
  return mezclar(todas, rng).slice(0, cantidad)
}

/* -------------------------------------------------------------------------- */
/* Partida                                                                     */
/* -------------------------------------------------------------------------- */

/** Crea una partida barajada con una copia de cada figura. */
export function crearPartida(
  figuras: readonly Fruta[],
  rng: () => number = Math.random,
): EstadoJuego {
  if (figuras.length < 2) {
    throw new Error('Una partida necesita al menos 2 figuras (una pareja).')
  }
  const duplicadas = figuras.flatMap((figura) => [figura, figura])
  const barajadas = mezclar(duplicadas, rng)
  const cartas: Carta[] = barajadas.map((figura, indice) => ({
    id: `c${indice + 1}`,
    figura,
    estado: 'oculta',
  }))

  return {
    cartas,
    intentos: 0,
    parejasEncontradas: 0,
    seleccion: [null, null],
    fase: 'jugando',
    evento: null,
  }
}

/** Crea una partida nueva con 6 figuras elegidas al azar entre las disponibles. */
export function nuevaPartida(
  rng: () => number = Math.random,
  figuras: readonly Fruta[] = FRUTAS,
  cantidad: number = PAREJAS_POR_PARTIDA,
): EstadoJuego {
  return crearPartida(elegirFiguras(rng, figuras, cantidad), rng)
}

/** Número total de parejas de la partida. */
export function totalParejas(estado: EstadoJuego): number {
  return new Set(estado.cartas.map((carta) => carta.figura)).size
}

/** ¿La partida está ganada? */
export function esVictoria(estado: EstadoJuego): boolean {
  const total = totalParejas(estado)
  return total > 0 && estado.parejasEncontradas === total
}

/* -------------------------------------------------------------------------- */
/* Jugadas                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * ¿Se puede revelar esta carta ahora mismo?
 * No si la partida terminó, si ya está emparejada, si ya está seleccionada
 * o si hay una jugada pendiente de resolver.
 */
export function puedeSeleccionar(estado: EstadoJuego, id: string): boolean {
  if (estado.fase !== 'jugando') return false
  const carta = estado.cartas.find((item) => item.id === id)
  if (!carta) return false
  if (carta.estado !== 'oculta') return false
  if (estado.seleccion[0] === id || estado.seleccion[1] === id) return false
  return true
}

/**
 * Revela una carta. La primera selección no cuenta intento; la segunda sí
 * (una jugada = dos cartas reveladas) y pasa la partida a fase 'evaluando'.
 */
export function seleccionarCarta(estado: EstadoJuego, id: string): EstadoJuego {
  if (!puedeSeleccionar(estado, id)) return estado

  const cartas = estado.cartas.map((carta) =>
    carta.id === id ? { ...carta, estado: 'revelada' as const } : carta,
  )

  const primera = estado.seleccion[0]
  if (primera === null) {
    return { ...estado, cartas, seleccion: [id, null], evento: null }
  }

  return {
    ...estado,
    cartas,
    seleccion: [primera, id],
    intentos: estado.intentos + 1,
    fase: 'evaluando',
    evento: null,
  }
}

/**
 * Resuelve la jugada en curso: si las dos cartas coinciden quedan emparejadas
 * y visibles; si no, quedan reveladas esperando el ocultado.
 */
export function evaluarSeleccion(estado: EstadoJuego): EstadoJuego {
  if (estado.fase !== 'evaluando') return estado

  const [idA, idB] = estado.seleccion
  if (idA === null || idB === null) return estado

  const cartaA = estado.cartas.find((carta) => carta.id === idA)
  const cartaB = estado.cartas.find((carta) => carta.id === idB)
  if (!cartaA || !cartaB) return estado

  if (cartaA.figura === cartaB.figura) {
    const cartas = estado.cartas.map((carta) =>
      carta.id === idA || carta.id === idB ? { ...carta, estado: 'emparejada' as const } : carta,
    )
    const parejasEncontradas = estado.parejasEncontradas + 1
    const ganado = parejasEncontradas === totalParejas(estado)

    return {
      ...estado,
      cartas,
      parejasEncontradas,
      seleccion: [null, null],
      fase: ganado ? 'ganado' : 'jugando',
      evento: ganado
        ? { tipo: 'victoria', intentos: estado.intentos, parejasEncontradas }
        : {
            tipo: 'pareja',
            figura: cartaA.figura,
            parejasEncontradas,
            intentos: estado.intentos,
          },
    }
  }

  return {
    ...estado,
    evento: {
      tipo: 'no-pareja',
      figuras: [cartaA.figura, cartaB.figura],
      intentos: estado.intentos,
    },
  }
}

/** Vuelve a ocultar las dos cartas que no coincidieron. */
export function ocultarNoCoincidentes(estado: EstadoJuego): EstadoJuego {
  if (estado.fase !== 'evaluando') return estado

  const [idA, idB] = estado.seleccion
  if (idA === null || idB === null) return estado

  const cartas = estado.cartas.map((carta) =>
    carta.id === idA || carta.id === idB ? { ...carta, estado: 'oculta' as const } : carta,
  )

  return { ...estado, cartas, seleccion: [null, null], fase: 'jugando' }
}

/* -------------------------------------------------------------------------- */
/* Reducer                                                                     */
/* -------------------------------------------------------------------------- */

export type Accion =
  | { tipo: 'SELECCIONAR'; id: string }
  | { tipo: 'OCULTAR_NO_COINCIDENTES' }
  | { tipo: 'NUEVA_PARTIDA'; rng?: () => number }

/**
 * Reducer puro: la capa de React solo despacha acciones.
 */
export function reducerJuego(estado: EstadoJuego, accion: Accion): EstadoJuego {
  switch (accion.tipo) {
    case 'SELECCIONAR': {
      const revelada = seleccionarCarta(estado, accion.id)
      if (revelada === estado) return estado
      return revelada.fase === 'evaluando' ? evaluarSeleccion(revelada) : revelada
    }
    case 'OCULTAR_NO_COINCIDENTES':
      return ocultarNoCoincidentes(estado)
    case 'NUEVA_PARTIDA':
      return nuevaPartida(accion.rng ?? Math.random)
    default:
      return estado
  }
}

/* -------------------------------------------------------------------------- */
/* Mensajes accesibles                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Texto que se anuncia en la región `role="status"` para lectores de pantalla.
 */
export function mensajeAnuncio(estado: EstadoJuego): string {
  const total = totalParejas(estado)
  const evento = estado.evento

  if (evento?.tipo === 'victoria') {
    return `¡Ganaste! Encontraste las ${total} parejas en ${evento.intentos} ${
      evento.intentos === 1 ? 'intento' : 'intentos'
    }.`
  }
  if (evento?.tipo === 'pareja') {
    return `Pareja encontrada: ${evento.figura}. ${evento.parejasEncontradas} de ${total} parejas. Intentos: ${evento.intentos}.`
  }
  if (evento?.tipo === 'no-pareja') {
    const [figuraA, figuraB] = evento.figuras
    return `No coinciden: ${figuraA} y ${figuraB}. Intento ${evento.intentos}.`
  }
  return `Intentos: ${estado.intentos}. Parejas encontradas: ${estado.parejasEncontradas} de ${total}.`
}
