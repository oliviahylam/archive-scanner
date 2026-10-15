import { useCallback, useEffect, useRef, useState } from 'react'
import { generateObjNumber, generateCitizenNumber } from '../../archive-rules'
import { makeCutout } from '../../cutout'
import { addLot, takenNumbers } from '../../db'
import { href, navigate } from '../../router'
import type { Lot } from '../../types'
import { Confirmation } from './Confirmation'
import { NameObject, type Draft } from './NameObject'
import { Processing } from './Processing'
import { ScanCamera } from './ScanCamera'

type Step =
  | { name: 'camera' }
  | { name: 'processing' }
  | { name: 'naming'; cutout: Blob; removed: boolean }
  | { name: 'done'; lot: Lot }

const newId = () =>
  crypto.randomUUID?.() ?? `lot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

/** Scan → Cataloguing… → Name your object → Lot added → the new lot. */
export function Catalogue() {
  const [step, setStep] = useState<Step>({ name: 'camera' })
  const [download, setDownload] = useState<number | null>(null)
  const alive = useRef(true)
  useEffect(() => () => void (alive.current = false), [])

  const onPhoto = async (photo: Blob) => {
    setStep({ name: 'processing' })
    setDownload(null)
    const { image, removed } = await makeCutout(photo, setDownload)
    if (alive.current) setStep({ name: 'naming', cutout: image, removed })
  }

  const onSubmit = async (draft: Draft) => {
    if (step.name !== 'naming') return
    // Numbers are checked again at the moment of saving, in case another lot took them.
    const taken = await takenNumbers()
    const lot: Lot = {
      id: newId(),
      ...draft,
      objNumber: taken.obj.has(draft.objNumber) ? generateObjNumber(taken.obj) : draft.objNumber,
      citizenNumber: taken.citizen.has(draft.citizenNumber)
        ? generateCitizenNumber(taken.citizen)
        : draft.citizenNumber,
      images: [step.cutout],
      createdAt: new Date().toISOString(),
      inherited: false,
    }
    await addLot(lot)
    setStep({ name: 'done', lot })
  }

  const lotId = step.name === 'done' ? step.lot.id : null
  const openLot = useCallback(() => {
    if (lotId) navigate(href.lot(lotId), { replace: true })
  }, [lotId])

  switch (step.name) {
    case 'camera':
      return <ScanCamera onPhoto={onPhoto} />
    case 'processing':
      return <Processing download={download} />
    case 'naming':
      return (
        <NameObject
          cutout={step.cutout}
          removed={step.removed}
          onRetake={() => setStep({ name: 'camera' })}
          onSubmit={onSubmit}
        />
      )
    case 'done':
      return <Confirmation objNumber={step.lot.objNumber} onDone={openLot} />
  }
}
