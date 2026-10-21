import type { Carta as CartaJuego } from '../game/logic'

interface CartaProps {
  carta: CartaJuego
  /** Posición en el tablero (1-based), para el anuncio accesible. */
  posicion: number
  onSeleccionar: (id: string) => void
}

/**
 * Una carta del tablero. Es un `<button>` real: se puede enfocar con Tab y
 * activar con Enter o Espacio sin código adicional.
 */
export function Carta({ carta, posicion, onSeleccionar }: CartaProps) {
  const revelada = carta.estado !== 'oculta'
  const emparejada = carta.estado === 'emparejada'

  const etiqueta = emparejada
    ? `Carta ${posicion}: ${carta.figura}, pareja encontrada`
    : revelada
      ? `Carta ${posicion}: ${carta.figura}`
      : `Carta ${posicion}, boca abajo`

  const clases = ['carta']
  if (revelada) clases.push('carta--revelada')
  if (emparejada) clases.push('carta--emparejada')

  return (
    <li className="celda">
      <button
        type="button"
        className={clases.join(' ')}
        aria-label={etiqueta}
        aria-disabled={emparejada}
        onClick={() => onSeleccionar(carta.id)}
      >
        <span className="carta__cara carta__dorso" aria-hidden="true">
          <span className="carta__patron">?</span>
        </span>
        <span className="carta__cara carta__frente" aria-hidden="true">
          <img className="carta__imagen" src={`/cartas/${carta.figura}.svg`} alt="" />
        </span>
      </button>
    </li>
  )
}
