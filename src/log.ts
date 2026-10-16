/**
 * A short diary of what the app did, kept on the phone (last 40 steps) so it
 * survives reloads. Shown on the status page: #/status
 */
const KEY = 'archive-log'

export interface LogEntry {
  t: string
  msg: string
}

export function readLog(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function log(msg: string) {
  try {
    const entries = [...readLog(), { t: new Date().toISOString(), msg }].slice(-40)
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    /* storage full or blocked: not important */
  }
}

export function clearLog() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Record app starts (and how: fresh, reload, back) and any crash messages. */
export function startLogging() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  log(`app opened (${nav?.type ?? 'unknown'}) at ${location.hash || '#/'} · version ${__APP_VERSION__}`)
  window.addEventListener('error', (e) => log(`error: ${e.message}`))
  window.addEventListener('unhandledrejection', (e) => log(`error: ${String(e.reason?.message ?? e.reason)}`))
  window.addEventListener('hashchange', () => log(`screen ${location.hash}`))
}
