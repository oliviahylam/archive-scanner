import { useState } from 'react'
import { useObjectUrl } from '../hooks/useObjectUrl'
import type { Lot } from '../types'

/** A lot's first photo. Shows the expected file name if the photo is missing. */
export function LotImage({ lot, eager = false }: { lot: Lot; eager?: boolean }) {
  const source = lot.images[0]
  const url = useObjectUrl(source)
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className="lot-img lot-img--missing" role="img" aria-label={lot.name}>
        {typeof source === 'string' ? source.split('/').pop() : 'No photo'}
      </div>
    )
  }
  return (
    <img
      className="lot-img"
      src={url}
      alt={lot.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
