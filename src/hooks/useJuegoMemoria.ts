import { useCallback, useEffect, useReducer, useState } from 'react'
import {
  MS_ESPERA_OCULTAR,
  nuevaPartida,
  reducerJuego,
  type EstadoJuego,
} from '../game/logic'
import { Programador } from '../game/reloj'

export interface UseJuegoMemoria {
  estado: EstadoJuego
  seleccionar: (id: string) => void
  nuevaPartida: () => void
}

/**
 * Conduce la partida: reducer puro + un único temporizador para ocultar las
 * cartas que no coinciden. El temporizador se cancela siempre (desmontaje,
 * reinicio o nueva selección), así que nunca queda colgado.
 */
export function useJuegoMemoria(): UseJuegoMemoria {
  const [estado, dispatch] = useReducer(reducerJuego, undefined, () => nuevaPartida(Math.random))
  const [programador] = useState(() => new Programador())

  useEffect(() => {
    if (estado.fase !== 'evaluando') {
      programador.cancelar()
      return undefined
    }

    programador.programar(() => {
      dispatch({ tipo: 'OCULTAR_NO_COINCIDENTES' })
    }, MS_ESPERA_OCULTAR)

    return () => {
      programador.cancelar()
    }
  }, [estado.fase, estado.seleccion, programador])

  const seleccionar = useCallback((id: string) => {
    dispatch({ tipo: 'SELECCIONAR', id })
  }, [])

  const empezar = useCallback(() => {
    programador.cancelar()
    dispatch({ tipo: 'NUEVA_PARTIDA' })
  }, [programador])

  return { estado, seleccionar, nuevaPartida: empezar }
}
