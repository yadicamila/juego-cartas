# AGENTS.md

Juego didáctico de memoria (parejas) en React 19 + TypeScript + Vite. Tablero 4x3, 6 parejas sorteadas de 12 figuras.

## Comandos

```bash
npm install
npm run dev        # Vite dev server
npm test           # vitest run (suite completa: 37 tests)
npm run lint       # eslint . (flat config)
npm run build      # tsc -b && vite build  → dist/
npm run preview    # sirve dist/
```

- No hay script de typecheck suelto: el type-check es `tsc -b` dentro de `npm run build`.
- Test suelto: `npx vitest run src/game/logic.test.ts` (28 tests) o `npx vitest run src/game/reloj.test.ts`.
- `npm run build` type-checkea **también** los archivos de test (`tsconfig.app.json` incluye `src`), así que un test roto rompe el build.
- `npm run lint` no falla por warnings (`react-refresh/only-export-components` es `warn`).

## Arquitectura (lo que no se deduce de los nombres)

- `src/game/logic.ts` y `src/game/reloj.ts` son **puros**: no deben importar React ni el DOM. Todo el azar es inyectable (`rng: () => number`), por eso los tests corren en `environment: 'node'` sin jsdom.
- Flujo real: `useJuegoMemoria` (hook) → `reducerJuego` (puro) → `Programador` (reloj inyectable) → `dispatch`. Los componentes de `src/components/` solo renderizan; no contienen reglas de juego.
- La espera de 1 s para ocultar cartas que no coinciden vive en `MS_ESPERA_OCULTAR` (`logic.ts`) y la aplica el hook. El `Programador` se cancela en el cleanup del `useEffect` y en `nuevaPartida`: **cualquier temporizador nuevo debe pasar por él**, nunca por `setTimeout` suelto.
- Los componentes de cartas deben seguir siendo `<button>` nativos con `aria-label` (no `disabled`, se usa `aria-disabled` para no sacarlos del orden de tabulación) y el texto se anuncia vía `role="status"` (`Anuncio.tsx`, con `mensajeAnuncio` en la lógica).
- Imágenes: `public/cartas/*.svg` servidas con ruta absoluta `/cartas/...` (ver `Carta.tsx`). Se copiaron de `../practicasesion/paquete-imagenes`; **no modificar los originales** y mantener la atribución CC-BY de Twemoji (pie de página + `public/cartas/LICENSE.md`).

## Restricciones del proyecto

- **Sin dependencias extra** más allá del scaffold estándar de Vite/React/TS + Vitest. No añadir librerías de UI, estado, rutas ni testing (`@testing-library` y `jsdom` no están instalados a propósito). Para probar componentes se usa `renderToStaticMarkup` de `react-dom/server` (ver `src/App.test.ts`).
- El bloque `test` de `vite.config.ts` incluye solo `src/**/*.test.ts`: un test en `.tsx` **no se ejecutaría**. Naming: `*.test.ts`.

## Gotchas de tooling

- ESLint 10 con flat config (`eslint.config.js`), no `.eslintrc`. React 19 + StrictMode: los efectos se ejecutan dos veces en dev, por eso `Programador.programar()` cancela el temporizador anterior.
- TypeScript estricto: `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` están activos (`tsconfig.app.json`) — el acceso a índices y las props opcionales requieren narrowing o `!`.
- `tsconfig.app.json` usa `types: ["vite/client"]` (imports de CSS); `tsconfig.node.json` usa `types: ["node"]` e incluye `vite.config.ts`.
- El directorio **no está bajo control de versiones** (no hay `.git`): no hay ramas, commits ni PRs aunque exista `.gitignore`.
- Rutas absolutas `/cartas/...` asumen `base: '/'`; cambiar el `base` de Vite rompe las imágenes.
