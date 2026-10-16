import { Brand } from '../../components/Brand'
import { TabBar } from '../../components/TabBar'
import { EVENING, updateDay, useDay } from '../../day'
import { href } from '../../router'

const TITLE = 'How will you spend your evening?'

/** One choice for the 18:30 slot. Gallery Visit is already bought. */
export function Choices() {
  const { evening } = useDay()

  return (
    <main className="choices">
      <Brand />
      <h1 className="choices__title">{TITLE}</h1>
      <p className="choices__label">Evening</p>

      <div className="choice-list" role="radiogroup" aria-label={TITLE}>
        {EVENING.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={evening === opt.id}
            disabled={opt.disabled}
            className="choice"
            onClick={() => updateDay({ evening: opt.id })}
          >
            <span className="choice__text">
              <span className="choice__title">{opt.title}</span>
              <span className="choice__tag">{opt.tag}</span>
            </span>
            {opt.points && <span className="choice__points">{opt.points}</span>}
          </button>
        ))}
      </div>

      <a className="btn-primary day-cta" href={href.day()}>
        Confirm
      </a>

      <TabBar active="choices" />
    </main>
  )
}
