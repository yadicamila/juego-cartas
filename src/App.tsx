import { esVictoria, totalParejas } from './game/logic'
import { useJuegoMemoria } from './hooks/useJuegoMemoria'
import { Anuncio } from './components/Anuncio'
import { Marcador } from './components/Marcador'
import { MensajeFinal } from './components/MensajeFinal'
import { Tablero } from './components/Tablero'
import './App.css'

export default function App() {
  const { estado, seleccionar, nuevaPartida } = useJuegoMemoria()
  const total = totalParejas(estado)
  const ganada = esVictoria(estado)

  return (
    <div className="app">
      <main className="contenido">
        <header className="cabecera">
          <h1 className="titulo">Encuentra las parejas</h1>
          <p className="intro">
            Revela dos cartas del tablero. Si muestran la misma figura, quedan emparejadas; si no,
            se vuelven a tapar. Encuentra las {total} parejas en el menor número de intentos.
          </p>
        </header>

        <Marcador
          intentos={estado.intentos}
          parejasEncontradas={estado.parejasEncontradas}
          totalParejas={total}
        />

        <Anuncio estado={estado} />

        <Tablero cartas={estado.cartas} onSeleccionar={seleccionar} />

        {ganada && (
          <MensajeFinal intentos={estado.intentos} totalParejas={total} onNuevaPartida={nuevaPartida} />
        )}

        {!ganada && (
          <button type="button" className="boton boton--secundario" onClick={nuevaPartida}>
            Nuevo juego
          </button>
        )}
      </main>

      <footer className="pie">
        <p>
          Imágenes: emojis de{' '}
          <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noreferrer">
            Twemoji
          </a>{' '}
          por Twitter, Inc. y contribuidores, bajo licencia{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
