import { Brand } from '../../components/Brand'
import { TabBar } from '../../components/TabBar'
import { SCHEDULE, eveningTitle, updateDay, useDay } from '../../day'
import { href, navigate } from '../../router'

/** The finished day, with the visitor's evening choice at 18:30. */
export function Day() {
  const { evening } = useDay()

  const done = () => {
    updateDay({ accepted: true })
    navigate(href.home())
  }

  return (
    <main className="schedule">
      <Brand />
      <h1 className="schedule__title">Your day is set</h1>

      <ol className="schedule__list">
        {SCHEDULE.map((row) => (
          <li key={row.time}>
            <time>{row.time}</time>
            <span>{row.item ?? eveningTitle(evening)}</span>
          </li>
        ))}
      </ol>

      <button type="button" className="btn-primary day-cta" onClick={done}>
        Done
      </button>

      <TabBar active="home" />
    </main>
  )
}
