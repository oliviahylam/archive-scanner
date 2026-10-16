import { useEffect, useState } from 'react'
import { HaloLogo } from '../../components/HaloLogo'
import { CITIZEN_ID, WELCOME, updateDay } from '../../day'

/** First visit to Home: agree to the prepared life before seeing the day. */
export function Welcome() {
  const [checked, setChecked] = useState(() => WELCOME.options.map((o) => o.id))
  const [hint, setHint] = useState('')
  const [manual, setManual] = useState(false)

  const toggle = (opt: (typeof WELCOME.options)[number]) => {
    if (opt.required) return setHint('This choice is required by your terms.')
    setHint('')
    setChecked((c) => (c.includes(opt.id) ? c.filter((id) => id !== opt.id) : [...c, opt.id]))
  }

  return (
    <main className="welcome">
      <div className="welcome__halo">
        <HaloLogo size={112} />
      </div>
      <p className="welcome__citizen">Citizen: {CITIZEN_ID}</p>
      <h1 className="welcome__title">{WELCOME.title}</h1>
      <p className="welcome__sub">{WELCOME.subtitle}</p>

      <ul className="terms">
        {WELCOME.options.map((opt) => {
          const on = checked.includes(opt.id)
          return (
            <li key={opt.id}>
              <button type="button" role="checkbox" aria-checked={on} className="terms__row" onClick={() => toggle(opt)}>
                <span className="terms__box">
                  {on && (
                    <svg width="12" height="11" viewBox="0 0 12 11" aria-hidden="true">
                      <path d="M1 5.6 4.4 9 11 1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </span>
                <span className="terms__label">{opt.label}</span>
                <span className="terms__tag">{opt.tag}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="field__hint welcome__hint" aria-live="polite">{hint}</p>

      <div className="welcome__actions">
        <button type="button" className="btn-primary btn-primary--block" onClick={() => updateDay({ agreed: true })}>
          Agree &amp; Continue
        </button>
        <button type="button" className="text-btn" onClick={() => setManual(true)}>
          Choose manually (est. review: 14 days)
        </button>
      </div>

      {manual && <ManualReview onClose={() => setManual(false)} />}
    </main>
  )
}

function ManualReview({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="manual-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="manual-title">Manual review requested</h2>
        <p>Estimated review: 14 days. Your recommended choices stay active until then.</p>
        <button type="button" className="btn-primary btn-primary--block" onClick={onClose} autoFocus>
          Return
        </button>
      </div>
    </div>
  )
}
