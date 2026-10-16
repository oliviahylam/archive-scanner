import { Brand } from '../../components/Brand'
import { TabBar } from '../../components/TabBar'
import { TODAY, useDay } from '../../day'
import { href } from '../../router'
import { Welcome } from './Welcome'

/** Today at a glance. Accepting the day leads to the evening choice. */
export function Home() {
  const day = useDay()
  if (!day.agreed) return <Welcome />

  return (
    <main className="today">
      <Brand />
      <header className="today__head">
        <h1>Good morning</h1>
        <p>A glimpse at today</p>
      </header>

      <div className="dial">
        <div className="dial__stats">
          {TODAY.stats.map((s) => (
            <div key={s.label} className="dial__stat">
              <span className="dial__label">{s.label}</span>
              <span className="dial__value">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="dial__hole">
          <span className="dial__count">{TODAY.choices}</span>
          <span className="dial__value">Choices</span>
        </div>
      </div>

      <a className="btn-primary day-cta" href={day.accepted ? href.day() : href.choices()}>
        {day.accepted ? 'View my day' : 'Accept my day'}
      </a>

      <TabBar active="home" />
    </main>
  )
}
