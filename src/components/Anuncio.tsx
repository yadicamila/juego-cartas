import { mensajeAnuncio, type EstadoJuego } from '../game/logic'

interface AnuncioProps {
  estado: EstadoJuego
}

/**
 * Región viva: los lectores de pantalla anuncian los intentos y el resultado
 * de cada jugada sin necesidad de que el usuario explore el tablero.
 */
export function Anuncio({ estado }: AnuncioProps) {
  return (
    <p className="anuncio" role="status" aria-live="polite" aria-atomic="true">
      {mensajeAnuncio(estado)}
    </p>
  )
}
