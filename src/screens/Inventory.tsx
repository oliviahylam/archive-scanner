import { useEffect, useLayoutEffect, useState } from 'react'
import { Brand } from '../components/Brand'
import { LotCard } from '../components/LotCard'
import { Pill } from '../components/Pill'
import { TabBar } from '../components/TabBar'
import { preloadCutoutModel } from '../cutout'
import { listLots } from '../db'
import { href } from '../router'
import type { Lot } from '../types'

const FILTERS = ['For you', 'Taste', 'Contact'] as const

// Remember where the visitor was in the grid when they open a lot and come back.
let savedScroll = 0
let savedFilter: (typeof FILTERS)[number] = 'For you'

export function Inventory() {
  const [lots, setLots] = useState<Lot[] | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState(savedFilter)

  useEffect(() => {
    const refresh = () => listLots().then(setLots, () => setError(true))
    refresh()
    // Others may be adding lots: look again every 20 seconds, and on returning to the page.
    const poll = setInterval(() => !document.hidden && refresh(), 20000)
    const onVisible = () => !document.hidden && refresh()
    document.addEventListener('visibilitychange', onVisible)
    // Fetch the background-removal model quietly, so the first scan doesn't wait for it.
    const idle = setTimeout(preloadCutoutModel, 1500)
    return () => {
      clearTimeout(idle)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useLayoutEffect(() => {
    const onScroll = () => (savedScroll = window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Restore the scroll position once, when the grid first appears.
  const restored = lots !== null
  useLayoutEffect(() => {
    if (restored) window.scrollTo(0, savedScroll)
  }, [restored])

  const choose = (f: (typeof FILTERS)[number]) => {
    savedFilter = f
    setFilter(f)
  }

  return (
    <main className="inventory">
      <Brand />
      <h1 className="inventory__title">Inventory</h1>
      <div className="filters" role="group" aria-label="Filter">
        {FILTERS.map((f) => (
          <Pill key={f} selected={filter === f} onClick={() => choose(f)}>
            {f}
          </Pill>
        ))}
      </div>

      {error && <p>The Archive could not be opened on this device. Please reload the page.</p>}

      <div className="grid" aria-busy={lots === null}>
        {lots?.map((lot, i) => <LotCard key={lot.id} lot={lot} eager={i < 4} />)}
      </div>

      <a className="btn-primary catalogue-fab" href={href.scan()}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        Catalogue an object
      </a>

      <TabBar />
    </main>
  )
}
