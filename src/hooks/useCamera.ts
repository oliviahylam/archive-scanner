import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable' | 'error'

/** The rear camera, streamed into a <video>. Stops when the screen closes. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Each start/stop bumps this, so a camera that opens after the screen moved on is closed again.
  const generation = useRef(0)
  const [state, setState] = useState<CameraState>('starting')

  const stop = useCallback(() => {
    generation.current++
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    stop()
    const mine = generation.current
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return
    }
    setState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
      })
      if (mine !== generation.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        await video.play().catch(() => {})
      }
      setState('live')
    } catch (err) {
      if (mine !== generation.current) return
      const name = (err as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') setState('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setState('unavailable')
      else setState('error')
    }
  }, [stop])

  useEffect(() => {
    start()
    // Free the camera if the phone locks or the visitor switches apps, and resume on return.
    const onVisibility = () => {
      if (document.hidden) stop()
      else if (!streamRef.current) start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [start, stop])

  return { videoRef, state, retry: start, stop }
}
