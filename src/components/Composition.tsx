import type { ReactNode } from 'react'

/** The horizontal crosshair line and two concentric rings, with the object centred on top. */
export function Composition({ children }: { children?: ReactNode }) {
  return (
    <div className="composition">
      <div className="composition__hline" />
      <div className="composition__ring composition__ring--outer" />
      <div className="composition__ring composition__ring--inner" />
      <div className="composition__object">{children}</div>
    </div>
  )
}
