import { Pill } from '../components/Pill'
import { goBack } from '../router'

/** Stand-in until the camera arrives in Phase 2. */
export function ScanSoon() {
  return (
    <main className="message">
      <Pill variant="back" onClick={goBack}>Back</Pill>
      <div className="message__body">
        <h1>Scanner</h1>
        <p>Cataloguing opens in the next phase of this build.</p>
      </div>
    </main>
  )
}
