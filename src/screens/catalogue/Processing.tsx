import { HaloLogo } from '../../components/HaloLogo'

export function Processing({ download }: { download: number | null }) {
  return (
    <main className="processing" role="status" aria-live="polite">
      <div className="vline" />
      <div className="composition">
        <div className="composition__hline" />
        <div className="composition__ring composition__ring--outer" />
        <div className="composition__ring composition__ring--inner" />
        <HaloLogo size={112} spin />
      </div>
      <div className="processing__text">
        <h1>Cataloguing…</h1>
        <p>
          {download !== null && download < 1
            ? `Preparing the scanner, first time only · ${Math.round(download * 100)}%`
            : 'Separating the object from its surroundings.'}
        </p>
      </div>
    </main>
  )
}
