/**
 * Reloj inyectable y programador de temporizadores.
 *
 * Permite que la capa de React (y las pruebas) controlen los tiempos sin
 * depender de `window` y garantiza que no queden temporizadores colgados:
 * `Programador.cancelar()` es idempotente y siempre libera el temporizador.
 */

export interface Reloj {
  setTimeout(callback: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

/** Reloj basado en los temporizadores globales del entorno. */
export const relojDelNavegador: Reloj = {
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>)
  },
}

/**
 * Programa una única acción diferida. Como máximo hay un temporizador vivo:
 * programar de nuevo cancela el anterior.
 */
export class Programador {
  private readonly reloj: Reloj
  private handle: unknown = null

  constructor(reloj: Reloj = relojDelNavegador) {
    this.reloj = reloj
  }

  /** ¿Hay un temporizador pendiente? */
  get pendiente(): boolean {
    return this.handle !== null
  }

  /** Programa la acción, cancelando cualquier temporizador anterior. */
  programar(callback: () => void, ms: number): void {
    this.cancelar()
    this.handle = this.reloj.setTimeout(callback, ms)
  }

  /** Cancela el temporizador pendiente (no hace nada si no hay ninguno). */
  cancelar(): void {
    if (this.handle === null) return
    this.reloj.clearTimeout(this.handle)
    this.handle = null
  }
}
