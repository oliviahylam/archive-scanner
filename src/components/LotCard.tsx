import { formatObjNumber } from '../archive-rules'
import { titleCase } from '../format'
import { href } from '../router'
import type { Lot } from '../types'
import { LotImage } from './LotImage'

export function LotCard({ lot, eager }: { lot: Lot; eager?: boolean }) {
  return (
    <a className="card" href={href.lot(lot.id)}>
      <div className="card__photo">
        <LotImage lot={lot} eager={eager} />
      </div>
      <div className="card__info">
        <span className="card__obj">{formatObjNumber(lot.objNumber)}</span>
        <span className="card__name">{titleCase(lot.name)}</span>
        <span className="card__seen">Last seen {lot.lastSeen}</span>
      </div>
    </a>
  )
}
