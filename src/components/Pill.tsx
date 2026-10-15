import type { ReactNode } from 'react'

export function Pill({
  children,
  selected,
  onClick,
  variant,
}: {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  variant?: 'back'
}) {
  return (
    <button
      type="button"
      className={variant ? `pill pill--${variant}` : 'pill'}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="pill__face">{children}</span>
    </button>
  )
}
