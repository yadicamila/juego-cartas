import { useEffect, useRef } from 'react'

interface MensajeFinalProps {
  intentos: number
  totalParejas: number
  onNuevaPartida: () => void
}

/** Mensaje de victoria y botón para empezar una partida nueva. */
export function MensajeFinal({ intentos, totalParejas, onNuevaPartida }: MensajeFinalProps) {
  const botonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    botonRef.current?.focus()
  }, [])

  return (
    <div className="victoria">
      <h2 className="victoria__titulo" tabIndex={-1}>
        ¡Has ganado!
      </h2>
      <p className="victoria__texto">
        Encontraste las {totalParejas} parejas en {intentos}{' '}
        {intentos === 1 ? 'intento' : 'intentos'}.
      </p>
      <button ref={botonRef} type="button" className="boton" onClick={onNuevaPartida}>
        Nuevo juego
      </button>
    </div>
  )
}
