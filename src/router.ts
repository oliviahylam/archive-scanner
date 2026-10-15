import { useEffect, useState } from 'react'

/**
 * Tiny hash-based router: #/ , #/lot/<id> , #/scan.
 * Hash links work on any static host and when the app is added to the home screen.
 */
export type Route =
  | { name: 'inventory' }
  | { name: 'lot'; id: string }
  | { name: 'scan' }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'lot' && parts[1]) return { name: 'lot', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'scan') return { name: 'scan' }
  return { name: 'inventory' }
}

export const href = {
  inventory: () => '#/',
  lot: (id: string) => `#/lot/${encodeURIComponent(id)}`,
  scan: () => '#/scan',
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
