import { HaloLogo } from './HaloLogo'

/** Halo ring + "TERMS OF LIVING". */
export function Brand() {
  return (
    <div className="brand">
      <HaloLogo />
      <span className="brand__name">
        Terms of
        <br />
        Living
      </span>
    </div>
  )
}
