import { HaloLogo } from './HaloLogo'
import { href } from '../router'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }

const ChoicesIcon = () => (
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="7.5" cy="14" r="4.5" {...stroke} />
    <line x1="12" y1="14" x2="17" y2="14" {...stroke} />
    <circle cx="21.5" cy="14" r="4.5" fill="currentColor" />
  </svg>
)

const InventoryIcon = () => (
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <rect x="5" y="5" width="18" height="18" {...stroke} />
  </svg>
)

const PermitIcon = () => (
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <path d="M14 5 L23.5 22 H4.5 Z" {...stroke} strokeLinejoin="miter" />
  </svg>
)

export type Tab = 'home' | 'choices' | 'inventory'

const TABS = [
  { id: 'home', label: 'Home', to: href.home(), icon: <HaloLogo size={30} /> },
  { id: 'choices', label: 'Choices', to: href.choices(), icon: <ChoicesIcon /> },
  { id: 'inventory', label: 'Inventory', to: href.inventory(), icon: <InventoryIcon /> },
] as const

/** Permit belongs to the wider Terms of Living world and isn't built yet. */
export function TabBar({ active }: { active: Tab }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <a key={t.id} className="tab" href={t.to} aria-current={active === t.id ? 'page' : undefined}>
          {t.icon}
          {t.label}
        </a>
      ))}
      <span className="tab" aria-disabled="true">
        <PermitIcon />
        Permit
      </span>
    </nav>
  )
}
