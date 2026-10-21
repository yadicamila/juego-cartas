import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import App from './App'

describe('smoke: render de la app', () => {
  it('renderiza 12 cartas, marcador y botón', () => {
    const html = renderToStaticMarkup(createElement(App))
    const botones = html.match(/<button/g) ?? []
    console.log('botones:', botones.length)
    console.log('aria-labels:', (html.match(/aria-label="Carta \d+, boca abajo"/g) ?? []).length)
    console.log('status:', /role="status"/.test(html))
    console.log('marcador:', /Intentos/.test(html), /0<!-- -->\/<!-- -->6|0\/6/.test(html))
    expect(botones.length).toBe(13)
    expect((html.match(/aria-label="Carta \d+, boca abajo"/g) ?? []).length).toBe(12)
    expect(html).toContain('role="status"')
    expect(html).toContain('Nuevo juego')
    expect(html).toContain('/cartas/')
  })
})
