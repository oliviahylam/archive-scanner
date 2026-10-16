import { useEffect, useId, useRef, useState } from 'react'
import {
  NAME_MAX_LENGTH,
  formatCitizen,
  formatObjNumber,
  generateCitizenNumber,
  generateLastSeen,
  generateObjNumber,
  pickDescription,
} from '../../archive-rules'
import { Brand } from '../../components/Brand'
import { Pill } from '../../components/Pill'
import { takenNumbers, type Draft } from '../../db'
import { useObjectUrl } from '../../hooks/useObjectUrl'

type Generated = Pick<Draft, 'objNumber' | 'citizenNumber' | 'lastSeen'>

async function generate(): Promise<Generated> {
  const taken = await takenNumbers()
  return {
    objNumber: generateObjNumber(taken.obj),
    citizenNumber: generateCitizenNumber(taken.citizen),
    lastSeen: generateLastSeen(),
  }
}

export function NameObject({
  cutout,
  removed,
  onRetake,
  onSubmit,
}: {
  cutout: Blob
  removed: boolean
  onRetake: () => void
  onSubmit: (draft: Draft) => Promise<void>
}) {
  const url = useObjectUrl(cutout)
  const ids = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState(pickDescription)
  const [generated, setGenerated] = useState<Generated | null>(null)
  const [showNameHint, setShowNameHint] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    generate().then(setGenerated)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setShowNameHint(true)
      inputRef.current?.focus()
      return
    }
    if (!generated || saving) return
    setSaving(true)
    setSaveError(false)
    try {
      await onSubmit({ ...generated, name: name.trim(), description: description.trim() })
    } catch {
      setSaveError(true)
      setSaving(false)
    }
  }

  return (
    <main className="name">
      <header className="topbar">
        <Pill variant="back" onClick={onRetake}>Retake</Pill>
        <Brand />
      </header>

      <div className="composition composition--preview">
        <div className="composition__vline" />
        <div className="composition__hline" />
        <div className="composition__ring composition__ring--outer" />
        <div className="composition__ring composition__ring--inner" />
        <div className="composition__object">
          {url && <img className="lot-img" src={url} alt="The object, ready to catalogue" />}
        </div>
      </div>
      {!removed && <p className="name__note">The background was kept for this object.</p>}

      <form className="name__form" onSubmit={submit} noValidate>
        <div className="field">
          <div className="field__head">
            <label className="field__label" htmlFor={`${ids}name`}>
              What is this object?
            </label>
            <span className="field__count" aria-hidden="true">
              {name.length}/{NAME_MAX_LENGTH}
            </span>
          </div>
          <input
            ref={inputRef}
            id={`${ids}name`}
            className="field__input"
            value={name}
            maxLength={NAME_MAX_LENGTH}
            placeholder="e.g. Thumbtack"
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="done"
            required
            aria-invalid={showNameHint && !name.trim()}
            aria-describedby={`${ids}hint`}
            onChange={(e) => {
              setName(e.target.value)
              if (e.target.value.trim()) setShowNameHint(false)
            }}
          />
          <p id={`${ids}hint`} className="field__hint" aria-live="polite">
            {showNameHint && !name.trim() ? 'Please name the object.' : ''}
          </p>
        </div>

        <section className="record" aria-label="Archive record">
          <div className="record__head">
            <span className="field__label">Archive record</span>
            <button
              type="button"
              className="text-btn"
              onClick={() => generate().then(setGenerated)}
            >
              Regenerate
            </button>
          </div>
          <dl className="record__list">
            <div>
              <dt>Object number</dt>
              <dd className="is-signal">{generated ? formatObjNumber(generated.objNumber) : '—'}</dd>
            </div>
            <div>
              <dt>Previous owner</dt>
              <dd className="is-signal">{generated ? formatCitizen(generated.citizenNumber) : '—'}</dd>
            </div>
            <div>
              <dt>Last seen</dt>
              <dd>{generated?.lastSeen ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <div className="field">
          <label className="field__label" htmlFor={`${ids}desc`}>
            Description <span className="field__optional">(optional)</span>
          </label>
          <textarea
            id={`${ids}desc`}
            className="field__input field__input--area"
            rows={3}
            maxLength={140}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {saveError && (
          <p className="field__hint" role="alert">
            The Archive could not be reached. Please check the connection and try again.
          </p>
        )}
        <button type="submit" className="btn-primary btn-primary--block" disabled={saving || !generated}>
          {saving ? 'Adding…' : 'Add to the Archive'}
        </button>
      </form>
    </main>
  )
}
