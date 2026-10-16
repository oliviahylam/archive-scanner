import { useCallback, useEffect, useRef, useState } from 'react'
import { fitForUpload, makeCutout } from '../../cutout'
import { addLot, type Draft } from '../../db'
import { href, navigate } from '../../router'
import { showActiveTab } from '../Inventory'
import { log } from '../../log'
import type { Lot } from '../../types'
import { Confirmation } from './Confirmation'
import { NameObject } from './NameObject'
import { Processing } from './Processing'
import { ScanCamera } from './ScanCamera'

type Step =
  | { name: 'camera' }
  | { name: 'processing' }
  | { name: 'naming'; cutout: Blob; removed: boolean }
  | { name: 'done'; lot: Lot }

/** Scan → Cataloguing… → Name your object → Lot added → the new lot. */
export function Catalogue() {
  const [step, setStep] = useState<Step>({ name: 'camera' })
  const [download, setDownload] = useState<number | null>(null)
  const alive = useRef(true)
  useEffect(() => () => void (alive.current = false), [])

  const onPhoto = async (photo: Blob) => {
    setStep({ name: 'processing' })
    setDownload(null)
    log(`photo captured (${Math.round(photo.size / 1024)} KB)`)
    const { image, removed } = await makeCutout(photo, setDownload)
    log(`cutout ready (${removed ? 'background removed' : 'background kept'}, ${Math.round(image.size / 1024)} KB)`)
    if (alive.current) setStep({ name: 'naming', cutout: image, removed })
  }

  const onSubmit = async (draft: Draft) => {
    if (step.name !== 'naming') return
    log(`add tapped: "${draft.name}"`)
    let lot
    try {
      lot = await addLot(draft, await fitForUpload(step.cutout))
    } catch (err) {
      log(`add failed: ${err instanceof Error ? err.message : String(err)}`)
      throw err
    }
    log(`added Obj ${lot.objNumber} (${typeof lot.images[0] === 'string' ? 'shared' : 'this phone only'}, ${lot.status})`)
    showActiveTab()
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
