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

/**
 * Home, Choices and Permit belong to the wider Terms of Living world
 * and aren't part of the Scanner, so only Inventory is active.
 */
export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      <span className="tab" aria-disabled="true">
        <HaloLogo size={30} />
        Home
      </span>
      <span className="tab" aria-disabled="true">
        <ChoicesIcon />
        Choices
      </span>
      <a className="tab" href={href.inventory()} aria-current="page">
        <InventoryIcon />
        Inventory
      </a>
      <span className="tab" aria-disabled="true">
        <PermitIcon />
        Permit
      </span>
    </nav>
  )
}
