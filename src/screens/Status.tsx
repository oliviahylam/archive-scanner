import { useEffect, useState } from 'react'
import { Pill } from '../components/Pill'
import { clearLog, readLog } from '../log'
import { goBack } from '../router'

/** Diagnostics for when something misbehaves on a phone. Open #/status. */
export function Status() {
  const [api, setApi] = useState('checking…')
  const [sw, setSw] = useState('checking…')
  const [entries, setEntries] = useState(readLog)

  useEffect(() => {
    fetch('/api/lots', { cache: 'no-store' })
      .then(async (r) => {
        const text = await r.text()
        let detail = text.slice(0, 80)
        try {
          const body = JSON.parse(text)
          detail = Array.isArray(body) ? `${body.length} lots` : JSON.stringify(body)
        } catch {
          detail = `not JSON: ${detail.replace(/\s+/g, ' ')}`
        }
        setApi(`${r.status} · ${detail}`)
      })
      .catch((e) => setApi(`failed: ${e.message}`))
    if (!('serviceWorker' in navigator)) setSw('not supported')
    else
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => setSw(reg?.active ? `active (${reg.waiting ? 'update waiting' : 'up to date'})` : 'none'))
  }, [])

  const rows: [string, string][] = [
    ['Version', __APP_VERSION__],
    ['Shared Archive', api],
    ['Offline support', sw],
    ['Browser', navigator.userAgent],
  ]

  return (
    <main className="status">
      <Pill variant="back" onClick={goBack}>Back</Pill>
      <h1>Status</h1>
      <dl className="record__list">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="status__head">
        <h2>Recent steps</h2>
        <button type="button" className="text-btn" onClick={() => (clearLog(), setEntries([]))}>
          Clear
        </button>
      </div>
      <ol className="status__log">
        {[...entries].reverse().map((e, i) => (
          <li key={i}>
            <time>{e.t.slice(11, 19)}</time> {e.msg}
          </li>
        ))}
      </ol>
    </main>
  )
}
