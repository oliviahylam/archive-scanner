import { useEffect, useState } from 'react'

/**
 * Tiny hash-based router. The app opens on Home (#/home, also #/). The scanner lives at
 * #/inventory , #/lot/<id> , #/scan. #/start clears the visitor's day and opens the welcome screen.
 * Hash links work on any static host and when the app is added to the home screen.
 */
export type Route =
  | { name: 'inventory' }
  | { name: 'lot'; id: string }
  | { name: 'scan' }
  | { name: 'status' }
  | { name: 'home' }
  | { name: 'choices' }
  | { name: 'day' }
  | { name: 'start' }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'lot' && parts[1]) return { name: 'lot', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'scan') return { name: 'scan' }
  if (parts[0] === 'status') return { name: 'status' }
  if (parts[0] === 'home') return { name: 'home' }
  if (parts[0] === 'choices') return { name: 'choices' }
  if (parts[0] === 'day') return { name: 'day' }
  if (parts[0] === 'inventory') return { name: 'inventory' }
  if (parts[0] === 'start') return { name: 'start' }
  return { name: 'home' }
}

export const href = {
  inventory: () => '#/inventory',
  lot: (id: string) => `#/lot/${encodeURIComponent(id)}`,
  scan: () => '#/scan',
  home: () => '#/home',
  choices: () => '#/choices',
  day: () => '#/day',
}

export function navigate(to: string, { replace = false } = {}) {
  if (replace) location.replace(to)
  else location.hash = to
}

let inAppSteps = 0
window.addEventListener('hashchange', () => inAppSteps++)

/** Back: return to the previous screen, or to the Inventory if the app was opened on this screen. */
export function goBack() {
  if (inAppSteps > 0) history.back()
  else navigate(href.inventory(), { replace: true })
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
