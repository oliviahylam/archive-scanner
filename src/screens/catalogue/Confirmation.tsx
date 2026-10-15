import { useEffect } from 'react'
import { formatObjNumber } from '../../archive-rules'
import { HaloLogo } from '../../components/HaloLogo'

/** A brief moment, then on to the new lot. Tapping skips ahead. */
export function Confirmation({ objNumber, onDone }: { objNumber: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <main className="confirm" role="status" onClick={onDone}>
      <HaloLogo size={72} />
      <h1>Lot added to the Archive.</h1>
      <p className="confirm__obj">{formatObjNumber(objNumber)}</p>
    </main>
  )
}
