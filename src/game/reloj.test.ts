import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Programador, type Reloj } from './reloj'
import {
  crearPartida,
  crearRng,
  elegirFiguras,
  reducerJuego,
  type EstadoJuego,
} from './logic'

/** Reloj falso que registra las llamadas, sin tocar los temporizadores reales. */
function crearRelojFalso() {
  const llamadas: { tipo: 'set' | 'clear'; ms: number; handle: number }[] = []
  let siguiente = 1
  return {
    llamadas,
    reloj: {
      setTimeout(_callback: () => void, ms: number) {
        const handle = siguiente
        siguiente += 1
        llamadas.push({ tipo: 'set', ms, handle })
        return handle
      },
      clearTimeout(handle: unknown) {
        llamadas.push({ tipo: 'clear', ms: 0, handle: handle as number })
      },
    } satisfies Reloj,
  }
}

describe('Programador', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ejecuta la acción exactamente cuando transcurren los milisegundos', () => {
    const programador = new Programador()
    const accion = vi.fn()

    programador.programar(accion, 1000)
    expect(accion).not.toHaveBeenCalled()
    expect(programador.pendiente).toBe(true)

    vi.advanceTimersByTime(999)
    expect(accion).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(accion).toHaveBeenCalledTimes(1)
  })

  it('cancelar impide que la acción llegue a ejecutarse', () => {
    const programador = new Programador()
    const accion = vi.fn()

    programador.programar(accion, 1000)
    programador.cancelar()

    expect(programador.pendiente).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(accion).not.toHaveBeenCalled()
  })

  it('cancelar es idempotente y no lanza si no hay temporizador', () => {
    const programador = new Programador()
    expect(() => programador.cancelar()).not.toThrow()
    programador.programar(() => {}, 1000)
    programador.cancelar()
    expect(() => programador.cancelar()).not.toThrow()
  })

  it('programar de nuevo cancela el temporizador anterior', () => {
    const programador = new Programador()
    const primera = vi.fn()
    const segunda = vi.fn()

    programador.programar(primera, 1000)
    programador.programar(segunda, 1000)

    vi.advanceTimersByTime(1000)
    expect(primera).not.toHaveBeenCalled()
    expect(segunda).toHaveBeenCalledTimes(1)
  })

  it('usa el reloj inyectado y libera el temporizador al cancelar', () => {
    const { reloj, llamadas } = crearRelojFalso()
    const programador = new Programador(reloj)

    programador.programar(() => {}, 1000)
    expect(llamadas).toEqual([{ tipo: 'set', ms: 1000, handle: 1 }])

    programador.cancelar()
    expect(llamadas[1]).toEqual({ tipo: 'clear', ms: 0, handle: 1 })
    expect(programador.pendiente).toBe(false)
  })
})

describe('ciclo de partida con temporizador', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('oculta las cartas que no coinciden al cumplirse la espera', () => {
    const programador = new Programador()
    let estado: EstadoJuego = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))

    const primera = estado.cartas[0]!
    const segunda = estado.cartas.find((carta) => carta.figura !== primera.figura)!
    estado = reducerJuego(estado, { tipo: 'SELECCIONAR', id: primera.id })
    estado = reducerJuego(estado, { tipo: 'SELECCIONAR', id: segunda.id })
    expect(estado.fase).toBe('evaluando')

    programador.programar(() => {
      estado = reducerJuego(estado, { tipo: 'OCULTAR_NO_COINCIDENTES' })
    }, 1000)

    vi.advanceTimersByTime(1000)
    expect(estado.fase).toBe('jugando')
    expect(estado.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
  })

  it('reiniciar la partida no deja temporizadores colgados', () => {
    const programador = new Programador()
    let estado: EstadoJuego = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))

    const primera = estado.cartas[0]!
    const segunda = estado.cartas.find((carta) => carta.figura !== primera.figura)!
    estado = reducerJuego(estado, { tipo: 'SELECCIONAR', id: primera.id })
    estado = reducerJuego(estado, { tipo: 'SELECCIONAR', id: segunda.id })

    programador.programar(() => {
      estado = reducerJuego(estado, { tipo: 'OCULTAR_NO_COINCIDENTES' })
    }, 1000)
    expect(vi.getTimerCount()).toBe(1)

    // Botón "Nuevo juego" durante la cuenta atrás: se cancela el temporizador.
    programador.cancelar()
    estado = reducerJuego(estado, { tipo: 'NUEVA_PARTIDA', rng: crearRng(4) })

    expect(vi.getTimerCount()).toBe(0)
    expect(programador.pendiente).toBe(false)

    vi.advanceTimersByTime(10000)
    expect(estado.intentos).toBe(0)
    expect(estado.parejasEncontradas).toBe(0)
    expect(estado.cartas.every((carta) => carta.estado === 'oculta')).toBe(true)
  })

  it('desmontar el juego no deja temporizadores colgados', () => {
    const programador = new Programador()
    const estado = crearPartida(elegirFiguras(crearRng(1)), crearRng(2))
    const primera = estado.cartas[0]!
    const segunda = estado.cartas.find((carta) => carta.figura !== primera.figura)!

    reducerJuego(
      reducerJuego(estado, { tipo: 'SELECCIONAR', id: primera.id }),
      { tipo: 'SELECCIONAR', id: segunda.id },
    )

    programador.programar(() => {}, 1000)
    expect(vi.getTimerCount()).toBe(1)

    // Cleanup del efecto (equivale a desmontar el componente).
    programador.cancelar()
    expect(vi.getTimerCount()).toBe(0)
  })
})
