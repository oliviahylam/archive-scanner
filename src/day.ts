import { useSyncExternalStore } from 'react'

/**
 * THE DAY
 * Copy for Home, Choices and the day schedule, from the Terms of Living
 * app wireframes in Figma. The visitor's answers are kept on the phone.
 */

export const CITIZEN_ID = '046-0314-2291'

export const WELCOME = {
  title: 'Your life is ready',
  subtitle: 'We have prepared 2,118 choices for you this week.',
  options: [
    { id: 'career', label: 'Select my career', tag: 'Recommended', required: false },
    { id: 'network', label: 'Choose my network', tag: 'Recommended', required: false },
    { id: 'beliefs', label: 'Refine my beliefs', tag: 'Required', required: true },
  ],
}

export const TODAY = {
  choices: 7,
  stats: [
    { label: 'Pre-selected', value: '7 of 7' },
    { label: 'Forecast', value: '+240 P' },
    { label: 'First choice', value: '07:30' },
    { label: 'Alignment', value: '100%' },
  ],
}

export interface EveningOption {
  id: string
  title: string
  tag: string
  points?: string
  disabled?: boolean
}

export const EVENING: EveningOption[] = [
  { id: 'home', title: 'Home · recharge', tag: 'Pre-selected', points: '+40' },
  { id: 'walk', title: 'Evening walk', tag: 'Recommended', points: '+20' },
  { id: 'dinner', title: 'Dinner, outside Group C-17', tag: 'Based on connections', points: '+3' },
  { id: 'locked', title: '-', tag: 'Not available at your tier', points: '-', disabled: true },
  { id: 'gallery', title: 'Gallery Visit', tag: 'Purchased choice' },
]

/** item: null is the evening slot, filled by the visitor's choice. */
export const SCHEDULE: { time: string; item: string | null }[] = [
  { time: '07:30', item: 'Nutri-Blend No.4' },
  { time: '08:15', item: 'Line 4, carriage 2' },
  { time: '12:30', item: 'Grain bowl, Kiosk 4' },
  { time: '15:00', item: 'Coffee with 044-2081-7730' },
  { time: '18:30', item: null },
  { time: '19:45', item: 'Episode 4 of 6, Harbour' },
  { time: '23:05', item: 'Sleep' },
]

// ---------- The visitor's day, saved on this phone ----------

export interface DayState {
  agreed: boolean
  evening: string
  accepted: boolean
}

const KEY = 'terms-of-living-day'
const START: DayState = { agreed: false, evening: 'gallery', accepted: false }

function read(): DayState {
  try {
    return { ...START, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return START
  }
}

let state = read()
const listeners = new Set<() => void>()

export function updateDay(patch: Partial<DayState>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage blocked: the day lasts until the page closes */
  }
  listeners.forEach((l) => l())
}

/** Back to the welcome screen, as on a first visit. */
export function resetDay() {
  updateDay(START)
}

export function useDay(): DayState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export function eveningTitle(id: string) {
  return EVENING.find((o) => o.id === id)?.title ?? ''
}
