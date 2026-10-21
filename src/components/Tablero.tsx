import type { Carta as CartaJuego } from '../game/logic'
import { Carta } from './Carta'

interface TableroProps {
  cartas: CartaJuego[]
  onSeleccionar: (id: string) => void
}

/** Rejilla de cartas. La lista mantiene el orden de tabulación del DOM. */
export function Tablero({ cartas, onSeleccionar }: TableroProps) {
  return (
    <ul className="tablero" aria-label="Tablero de cartas">
      {cartas.map((carta, indice) => (
        <Carta
          key={carta.id}
          carta={carta}
          posicion={indice + 1}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </ul>
  )
}
