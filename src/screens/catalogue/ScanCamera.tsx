import { useRef, useState } from 'react'
import { Pill } from '../../components/Pill'
import { captureFrame, squarePhoto } from '../../cutout'
import { useCamera } from '../../hooks/useCamera'
import { goBack } from '../../router'

const MESSAGES = {
  starting: { title: 'Opening camera', body: '' },
  denied: {
    title: 'Camera access is off',
    body: 'To catalogue an object, allow camera access for this site in your browser settings, then try again.',
  },
  unavailable: {
    title: 'No camera available',
    body: 'This browser cannot open a camera here. You can choose a photo instead.',
  },
  error: { title: 'The camera could not start', body: 'Please try again.' },
}

export function ScanCamera({ onPhoto }: { onPhoto: (photo: Blob) => void }) {
  const { videoRef, state, retry, stop } = useCamera()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const capture = async () => {
    const video = videoRef.current
    if (!video || state !== 'live' || busy) return
    setBusy(true)
    try {
      const photo = await captureFrame(video)
      navigator.vibrate?.(15)
      stop()
      onPhoto(photo)
    } catch {
      setBusy(false)
    }
  }

  const choose = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const photo = await squarePhoto(file)
      stop()
      onPhoto(photo)
    } catch {
      setBusy(false)
    }
  }

  const message = state === 'live' ? null : MESSAGES[state]

  return (
    <main className="scan">
      <video ref={videoRef} className="scan__video" playsInline muted autoPlay aria-hidden="true" />

      <div className="scan__overlay" aria-hidden="true">
        <div className="vline" />
        <div className="composition__hline" />
        <div className="composition__ring composition__ring--outer" />
        <div className="composition__ring composition__ring--inner" />
      </div>

      <header className="scan__top">
        <Pill variant="back" onClick={goBack}>Back</Pill>
        {state === 'live' && <p className="scan__hint">Centre the object inside the rings</p>}
      </header>

      {message && (
        <div className="scan__message" role="status">
          <h1>{message.title}</h1>
          {message.body && <p>{message.body}</p>}
          {state !== 'starting' && state !== 'unavailable' && (
            <button type="button" className="btn-primary" onClick={retry}>
              Try again
            </button>
          )}
        </div>
      )}

      <footer className="scan__bottom">
        <button type="button" className="text-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          Choose a photo
        </button>
        <button
          type="button"
          className="shutter"
          onClick={capture}
          disabled={state !== 'live' || busy}
          aria-label="Capture"
        >
          <span />
        </button>
        <span className="scan__spacer" />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </footer>
    </main>
  )
}
