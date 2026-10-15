import { useEffect, useState } from 'react'

/** Turns a stored photo (Blob) into something an <img> can show. URLs pass through. */
export function useObjectUrl(source: string | Blob | undefined): string | undefined {
  const [url, setUrl] = useState(() => (typeof source === 'string' ? source : undefined))
  useEffect(() => {
    if (!source || typeof source === 'string') {
      setUrl(source)
      return
    }
    const objectUrl = URL.createObjectURL(source)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [source])
  return url
}
