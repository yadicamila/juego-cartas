interface MarcadorProps {
  intentos: number
  parejasEncontradas: number
  totalParejas: number
}

/** Marcador visible con los intentos y las parejas encontradas. */
export function Marcador({ intentos, parejasEncontradas, totalParejas }: MarcadorProps) {
  return (
    <div className="marcador">
      <p className="marcador__dato">
        <span className="marcador__etiqueta">Intentos</span>
        <span className="marcador__valor">{intentos}</span>
      </p>
      <p className="marcador__dato">
        <span className="marcador__etiqueta">Parejas</span>
        <span className="marcador__valor">
          {parejasEncontradas}/{totalParejas}
        </span>
      </p>
    </div>
  )
}
