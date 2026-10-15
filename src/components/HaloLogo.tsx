import { useId } from 'react'

/** The halo ring: a dark ring lit from the top left, with a soft glow. */
export function HaloLogo({ size = 36, spin = false }: { size?: number; spin?: boolean }) {
  const id = useId()
  return (
    <svg
      className={spin ? 'halo halo--spin' : 'halo'}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0.15" y1="0.05" x2="0.8" y2="0.95">
          <stop offset="0" stopColor="#BDF6FC" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#5f8f99" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b1216" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <circle cx="20" cy="20" r="13" fill="none" stroke={`url(#${id}g)`} strokeWidth="6" filter={`url(#${id}b)`} opacity="0.7" />
      <circle cx="20" cy="20" r="13" fill="none" stroke={`url(#${id}g)`} strokeWidth="4.5" />
    </svg>
  )
}
