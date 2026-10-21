# Encuentra las parejas

Juego didáctico de memoria (parejas) para talleres. Tablero de 4x3 con 6 parejas
de frutas y verduras que se sortean en cada partida.

## Requisitos

- Node.js 20.19+ o 22.12+ (probado con Node 24)
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # pruebas unitarias (Vitest)
npm run build    # comprobación de tipos + build de producción en dist/
npm run lint     # ESLint
npm run preview  # sirve el build de producción
```

## Cómo se juega

1. Se revelan dos cartas con clic, Enter o Espacio.
2. Si muestran la misma figura, quedan emparejadas y visibles.
3. Si no coinciden, se vuelven a tapar al cabo de 1 segundo.
4. Gana quien encuentre las 6 parejas en menos intentos. Cada jugada (dos cartas
   reveladas) cuenta como un intento, acierte o falle.
5. El botón **Nuevo juego** reparte una combinación nueva de 6 figuras.

## Estructura

```
public/cartas/        12 SVG de Twemoji + LICENSE.md (atribución)
src/game/logic.ts     Lógica pura: estado, acciones y reducer (sin React ni DOM)
src/game/reloj.ts     Reloj inyectable y programador de temporizadores
src/hooks/            Puente entre React y la lógica pura
src/components/       Tablero, Carta, Marcador, Anuncio y MensajeFinal
```

La lógica de juego no importa React ni el DOM: son funciones puras
`(estado) -> estado nuevo` con el azar inyectado, por lo que se prueban sin
simular navegador.

## Accesibilidad

- Cada carta es un `<button>` nativo: se recorre con `Tab` y se activa con
  `Enter` o `Espacio`, sin código extra.
- El `aria-label` de cada carta describe su estado ("Carta 3, boca abajo",
  "Carta 3: manzana", "Carta 3: manzana, pareja encontrada").
- La región `role="status"` anuncia los intentos y el resultado de cada jugada
  ("Pareja encontrada: manzana. 1 de 6 parejas. Intentos: 1.").
- Las cartas ya emparejadas usan `aria-disabled` (no `disabled`) para que no
  salgan del orden de tabulación.
- Al ganar, el foco se traslada al botón "Nuevo juego".
- Foco visible con `:focus-visible` y transiciones desactivadas con
  `prefers-reduced-motion: reduce`.

## Verificación

| Criterio | Cómo se comprueba |
| --- | --- |
| `npm test` pasa (éxito, error y límites) | 37 pruebas en `src/game/logic.test.ts`, `src/game/reloj.test.ts` y `src/App.test.ts`: partidas válidas, parejas correctas, jugadas fallidas, jugadas inválidas (misma carta, carta emparejada, tercera carta, partida ganada), valores límite (0 o 1 figura, más figuras de las disponibles, contadores a 0) y temporizadores. |
| `npm run build` y `npm run lint` sin errores | `tsc -b` en modo estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) y `eslint .` con las reglas de hooks de React. |
| Se puede jugar con teclado y el lector de pantalla anuncia los intentos | `Tab` recorre las 12 cartas y el botón "Nuevo juego"; `Enter` y `Espacio` voltean la carta enfocada. Verificado en Chrome (CDP): 24 comprobaciones de interacción + 10 de teclado. La región `role="status"` anuncia cada jugada. |
| Reiniciar no deja temporizadores colgados | Prueba automática con `vi.useFakeTimers()`: tras reiniciar, `vi.getTimerCount() === 0` y el estado no cambia al avanzar el reloj. Además, el `cleanup` del efecto cancela el temporizador al desmontar. |

## Créditos y licencias

Las imágenes son emojis de [Twemoji](https://github.com/jdecked/twemoji)
(© Twitter, Inc. y contribuidores), bajo licencia
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). La atribución
visible está en el pie de la aplicación y el detalle en `public/cartas/LICENSE.md`.
