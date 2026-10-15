import { useEffect, useState } from 'react'
import { formatCitizen, formatObjNumber } from '../archive-rules'
import { Brand } from '../components/Brand'
import { Composition } from '../components/Composition'
import { LotImage } from '../components/LotImage'
import { Pill } from '../components/Pill'
import { getLot } from '../db'
import { goBack } from '../router'
import type { Lot } from '../types'

export function ItemDetail({ id }: { id: string }) {
  const [lot, setLot] = useState<Lot | null | undefined>(undefined)

  useEffect(() => {
    getLot(id).then((l) => setLot(l ?? null), () => setLot(null))
  }, [id])

  if (lot === undefined) return <div className="detail" aria-busy="true" />

  if (lot === null) {
    return (
      <main className="message">
        <Pill variant="back" onClick={goBack}>Back</Pill>
        <div className="message__body">
          <h1>Lot not found</h1>
          <p>This lot is no longer in the Archive on this device.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="detail">
      <div className="vline" />
      <header className="topbar">
        <Pill variant="back" onClick={goBack}>Back</Pill>
        <Brand />
      </header>

      <h1 className="detail__title">{lot.name}</h1>
      <div className="detail__label">Recovered from</div>
      <div className="detail__citizen">{formatCitizen(lot.citizenNumber)}</div>

      <Composition>
        <LotImage lot={lot} eager />
      </Composition>

      <div className="detail__bottom">
        <div>
          <div className="detail__obj">{formatObjNumber(lot.objNumber)}</div>
          <p className="detail__desc">{lot.description}</p>
        </div>
        <button type="button" className="round-btn" aria-label="Inherit this object">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M5 17 L17 5 M8 5 H17 V14" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
    </main>
  )
}
