---
name: revisar-react
description: Revisa componentes React y sus buenas prácticas (tipado, accesibilidad, arquitectura). Úsala al pedir una revisión de componentes, no para revisar lógica pura de src/game ni estilos CSS.
---
## Cuándo usarla
Al revisar archivos de `src/components/` o `src/App.tsx`, o los cambios de un PR que los toquen.

## Cuándo NO usarla
Lógica pura de `src/game/` (usa estandar-pruebas) o solo estilos. Si el archivo no es React, dilo y detente.

## Criterios
- Componentización y reutilización.
- Tipado de TypeScript (sin `any`, props explícitas).
- Accesibilidad y manejo de errores (roles, `aria-*`, foco, teclado).
- Efectos: dependencias correctas y limpieza de temporizadores/suscripciones.
- Consistencia con la arquitectura del proyecto (`src/game` = lógica pura, `src/components` = presentación).

## Salida esperada
Tabla de hallazgos: prioridad (alta, media, baja) · archivo:línea · problema · mejora concreta.
Cierra con "Verificado leyendo: <archivos>" para que se vea qué se revisó de verdad.
No modifiques archivos hasta que se confirme. No inventes archivos o líneas: si no lo viste, no lo reportes.