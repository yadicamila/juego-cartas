import { describe, expect, it } from 'vitest'
import {
  PAREJAS_POR_PARTIDA,
  crearPartida,
  crearRng,
  elegirFiguras,
  esVictoria,
  evaluarSeleccion,
  FRUTAS,
  mensajeAnuncio,
  mezclar,
  nuevaPartida,
  ocultarNoCoincidentes,
  puedeSeleccionar,
  reducerJuego,
  seleccionarCarta,
  totalParejas,
  type EstadoJuego,
  type Fruta,
} from './logic'

/* ------------------------------------------------------------------ */
/* Utilidades de apoyo                                               */
/* ------------------------------------------------------------------ */

/** Devuelve el id de la primera carta con la figura indicada. */
function idDeFigura(estado: EstadoJuego, figura: Fruta): string {
  const carta = estado.cartas.find((item) => item.figura === figura)
  if (!carta) throw new Error(`La partida no contiene la figura ${figura}`)
  return carta.id
}

/** Devuelve el id de la segunda carta con la figura indicada. */
function idDeFiguraDistinta(estado: EstadoJuego, figura: Fruta): string {
  const carta = estado.cartas.find((item) => item.figura === figura && item.id !== idDeFigura(estado, figura))
  if (!carta) throw new Error(`La partida no contiene dos copias de ${figura}`)
  return carta.id
}

/** Jugada completa de dos cartas con figuras distintas (reveladas y evaluadas). */
function jugadaDistinta(estado: EstadoJuego): EstadoJuego {
  const primera = estado.cartas[0]!
  const segunda = estado.cartas.find((carta) => carta.figura !== primera.figura)!
  let resultado = seleccionarCarta(estado, primera.id)
  resultado = seleccionarCarta(resultado, segunda.id)
  return evaluarSeleccion(resultado)
}

/* ------------------------------------------------------------------ */
/* Éxito                                                              */
/* ------------------------------------------------------------------ */

describe('crearPartida', () => {
  it('crea 12 cartas ocultas con 6 figuras duplicadas', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))

    expect(estado.cartas).toHaveLength(12)
    expect(estado.intentos).toBe(0)
    expect(estado.parejasEncontradas).toBe(0)
    expect(estado.fase).toBe('jugando')
    expect(estado.seleccion).toEqual([null, null])
    expect(estado.evento).toBeNull()
    expect(estado.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
    expect(totalParejas(estado)).toBe(PAREJAS_POR_PARTIDA)
    expect(new Set(estado.cartas.map((carta) => carta.figura)).size).toBe(PAREJAS_POR_PARTIDA)
    for (const figura of new Set(estado.cartas.map((carta) => carta.figura))) {
      expect(estado.cartas.filter((carta) => carta.figura === figura)).toHaveLength(2)
    }
  })

  it('asigna identificadores únicos a todas las cartas', () => {
    const estado = crearPartida(elegirFiguras(crearRng(7)), crearRng(8))
    const ids = estado.cartas.map((carta) => carta.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('baraja de forma determinista con la misma semilla', () => {
    const a = crearPartida(elegirFiguras(crearRng(42)), crearRng(42))
    const b = crearPartida(elegirFiguras(crearRng(42)), crearRng(42))
    expect(a.cartas.map((carta) => carta.figura)).toEqual(b.cartas.map((carta) => carta.figura))
  })

  it('mezcla sin perder ni duplicar elementos', () => {
    const elementos = [1, 2, 3, 4, 5, 6, 7, 8]
    const resultado = mezclar(elementos, crearRng(3))
    expect(resultado).toHaveLength(elementos.length)
    expect([...resultado].sort((a, b) => a - b)).toEqual(elementos)
    expect(elementos).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('elige 6 figuras distintas entre las 12 disponibles', () => {
    const figuras = elegirFiguras(crearRng(11))
    expect(figuras).toHaveLength(PAREJAS_POR_PARTIDA)
    expect(new Set(figuras).size).toBe(PAREJAS_POR_PARTIDA)
    for (const figura of figuras) {
      expect(FRUTAS).toContain(figura)
    }
  })
})

describe('jugada con pareja correcta', () => {
  it('revela dos cartas y cuenta un intento', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const id = idDeFigura(estado, estado.cartas[0]!.figura)

    const primera = seleccionarCarta(estado, id)
    expect(primera.cartas.find((carta) => carta.id === id)?.estado).toBe('revelada')
    expect(primera.intentos).toBe(0)
    expect(primera.fase).toBe('jugando')

    const segunda = seleccionarCarta(primera, idDeFiguraDistinta(primera, estado.cartas[0]!.figura))
    expect(segunda.intentos).toBe(1)
    expect(segunda.fase).toBe('evaluando')
  })

  it('empareja y deja visibles las dos cartas coincidentes', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const figura = estado.cartas[0]!.figura
    const idA = idDeFigura(estado, figura)
    const idB = idDeFiguraDistinta(estado, figura)

    const conSeleccion = seleccionarCarta(seleccionarCarta(estado, idA), idB)
    const evaluado = evaluarSeleccion(conSeleccion)

    expect(evaluado.parejasEncontradas).toBe(1)
    expect(evaluado.fase).toBe('jugando')
    expect(evaluado.seleccion).toEqual([null, null])
    expect(evaluado.cartas.find((carta) => carta.id === idA)?.estado).toBe('emparejada')
    expect(evaluado.cartas.find((carta) => carta.id === idB)?.estado).toBe('emparejada')
    expect(evaluado.evento).toMatchObject({ tipo: 'pareja', figura })
  })

  it('completa la partida y la marca como ganada', () => {
    let estado = crearPartida(elegirFiguras(crearRng(5)), crearRng(6))

    for (const figura of new Set(estado.cartas.map((carta) => carta.figura))) {
      const idA = idDeFigura(estado, figura)
      const idB = idDeFiguraDistinta(estado, figura)
      estado = evaluarSeleccion(seleccionarCarta(seleccionarCarta(estado, idA), idB))
    }

    expect(estado.parejasEncontradas).toBe(PAREJAS_POR_PARTIDA)
    expect(estado.fase).toBe('ganado')
    expect(esVictoria(estado)).toBe(true)
    expect(estado.intentos).toBe(PAREJAS_POR_PARTIDA)
    expect(estado.evento).toMatchObject({ tipo: 'victoria' })
  })
})

describe('jugada sin pareja', () => {
  it('deja las cartas reveladas a la espera de ocultarlas', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))

    expect(estado.fase).toBe('evaluando')
    expect(estado.parejasEncontradas).toBe(0)
    expect(estado.intentos).toBe(1)
    expect(estado.cartas.filter((carta) => carta.estado === 'revelada')).toHaveLength(2)
    expect(estado.evento).toMatchObject({ tipo: 'no-pareja' })
  })

  it('vuelve a ocultar las cartas que no coincidieron', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    const ocultado = ocultarNoCoincidentes(estado)

    expect(ocultado.fase).toBe('jugando')
    expect(ocultado.seleccion).toEqual([null, null])
    expect(ocultado.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
    expect(ocultado.intentos).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/* Errores y jugadas inválidas                                       */
/* ------------------------------------------------------------------ */

describe('jugadas inválidas', () => {
  it('ignora seleccionar dos veces la misma carta', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const id = estado.cartas[0]!.id

    const resultado = seleccionarCarta(seleccionarCarta(estado, id), id)

    expect(resultado.intentos).toBe(0)
    expect(resultado.seleccion).toEqual([id, null])
    expect(resultado.fase).toBe('jugando')
  })

  it('ignora seleccionar una carta que ya está emparejada', () => {
    let estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const figura = estado.cartas[0]!.figura
    const idA = idDeFigura(estado, figura)
    const idB = idDeFiguraDistinta(estado, figura)
    estado = evaluarSeleccion(seleccionarCarta(seleccionarCarta(estado, idA), idB))

    expect(puedeSeleccionar(estado, idA)).toBe(false)
    const resultado = seleccionarCarta(estado, idA)
    expect(resultado).toBe(estado)
    expect(resultado.parejasEncontradas).toBe(1)
  })

  it('ignora una tercera carta mientras hay una jugada pendiente', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    const tercera = estado.cartas.find(
      (carta) => !estado.seleccion.includes(carta.id) && carta.estado === 'oculta',
    )!

    const resultado = seleccionarCarta(estado, tercera.id)
    expect(resultado).toBe(estado)
    expect(resultado.intentos).toBe(1)
  })

  it('ignora un identificador de carta inexistente', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    expect(seleccionarCarta(estado, 'no-existe')).toBe(estado)
  })

  it('ignora cualquier selección cuando la partida está ganada', () => {
    let estado = crearPartida(elegirFiguras(crearRng(5)), crearRng(6))
    for (const figura of new Set(estado.cartas.map((carta) => carta.figura))) {
      const idA = idDeFigura(estado, figura)
      const idB = idDeFiguraDistinta(estado, figura)
      estado = evaluarSeleccion(seleccionarCarta(seleccionarCarta(estado, idA), idB))
    }

    expect(estado.fase).toBe('ganado')
    expect(seleccionarCarta(estado, estado.cartas[0]!.id)).toBe(estado)
  })

  it('no evalúa ni oculta si no hay una jugada en curso', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    expect(evaluarSeleccion(estado)).toBe(estado)
    expect(ocultarNoCoincidentes(estado)).toBe(estado)
  })
})

/* ------------------------------------------------------------------ */
/* Valores límite                                                    */
/* ------------------------------------------------------------------ */

describe('valores límite', () => {
  it('rechaza crear una partida sin figuras o con una sola', () => {
    expect(() => crearPartida([])).toThrow(/al menos 2 figuras/)
    expect(() => crearPartida(['manzana'])).toThrow(/al menos 2 figuras/)
  })

  it('rechaza pedir más figuras de las disponibles', () => {
    expect(() => elegirFiguras(crearRng(1), FRUTAS, FRUTAS.length + 1)).toThrow(/No se pueden elegir/)
    expect(() => elegirFiguras(crearRng(1), FRUTAS, -1)).toThrow(/no puede ser negativa/)
  })

  it('acepta exactamente el número máximo de figuras disponibles', () => {
    const figuras = elegirFiguras(crearRng(1), FRUTAS, FRUTAS.length)
    expect(figuras).toHaveLength(FRUTAS.length)
    expect(new Set(figuras).size).toBe(FRUTAS.length)
  })

  it('el contador de intentos empieza en cero y sube de uno en uno', () => {
    let estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    expect(estado.intentos).toBe(0)

    estado = jugadaDistinta(estado)
    expect(estado.intentos).toBe(1)

    estado = ocultarNoCoincidentes(estado)
    estado = jugadaDistinta(estado)
    expect(estado.intentos).toBe(2)
  })

  it('nuevaPartida reincia todos los contadores', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    const reiniciada = nuevaPartida(crearRng(9))

    expect(reiniciada.intentos).toBe(0)
    expect(reiniciada.parejasEncontradas).toBe(0)
    expect(reiniciada.fase).toBe('jugando')
    expect(reiniciada.evento).toBeNull()
    expect(reiniciada.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
    expect(estado.intentos).toBe(1)
  })
})

/* ------------------------------------------------------------------ */
/* Reducer                                                            */
/* ------------------------------------------------------------------ */

describe('reducerJuego', () => {
  it('resuelve la pareja en una sola acción de selección', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const figura = estado.cartas[0]!.figura
    const idA = idDeFigura(estado, figura)
    const idB = idDeFiguraDistinta(estado, figura)

    const tras = reducerJuego(estado, { tipo: 'SELECCIONAR', id: idA })
    const dos = reducerJuego(tras, { tipo: 'SELECCIONAR', id: idB })

    expect(dos.parejasEncontradas).toBe(1)
    expect(dos.intentos).toBe(1)
    expect(dos.fase).toBe('jugando')
  })

  it('oculta las cartas no coincidentes con la acción correspondiente', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    const ocultado = reducerJuego(estado, { tipo: 'OCULTAR_NO_COINCIDENTES' })
    expect(ocultado.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
    expect(ocultado.fase).toBe('jugando')
  })

  it('empieza una partida nueva con la acción NUEVA_PARTIDA', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    const nueva = reducerJuego(estado, { tipo: 'NUEVA_PARTIDA', rng: crearRng(3) })
    expect(nueva.intentos).toBe(0)
    expect(nueva.parejasEncontradas).toBe(0)
    expect(nueva.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
  })
})

/* ------------------------------------------------------------------ */
/* Mensajes accesibles                                               */
/* ------------------------------------------------------------------ */

describe('mensajeAnuncio', () => {
  it('anuncia los intentos y las parejas del estado inicial', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    expect(mensajeAnuncio(estado)).toBe('Intentos: 0. Parejas encontradas: 0 de 6.')
  })

  it('anuncia el número de intento y el fallo', () => {
    const estado = jugadaDistinta(crearPartida(elegirFiguras(crearRng(1)), crearRng(2)))
    expect(mensajeAnuncio(estado)).toMatch(/^No coinciden: .+ y .+\. Intento 1\.$/)
  })

  it('anuncia la pareja encontrada', () => {
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const figura = estado.cartas[0]!.figura
    const evaluado = evaluarSeleccion(
      seleccionarCarta(seleccionarCarta(estado, idDeFigura(estado, figura)), idDeFiguraDistinta(estado, figura)),
    )
    expect(mensajeAnuncio(evaluado)).toBe(`Pareja encontrada: ${figura}. 1 de 6 parejas. Intentos: 1.`)
  })

  it('anuncia la victoria con los intentos totales', () => {
    let estado = crearPartida(elegirFiguras(crearRng(5)), crearRng(6))
    for (const figura of new Set(estado.cartas.map((carta) => carta.figura))) {
      estado = evaluarSeleccion(
        seleccionarCarta(seleccionarCarta(estado, idDeFigura(estado, figura)), idDeFiguraDistinta(estado, figura)),
      )
    }
    expect(mensajeAnuncio(estado)).toBe('¡Ganaste! Encontraste las 6 parejas en 6 intentos.')
  })
})
