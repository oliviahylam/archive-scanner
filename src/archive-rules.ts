/**
 * ARCHIVE RULES
 * -------------
 * Everything that decides how a new lot is numbered and described.
 * This is the one file to edit when you want to change the formats,
 * the date range or the description bank. Save the file and the app
 * picks up the change.
 */

/** Object number: "Obj " + 4 digits. Lowest and highest number allowed. */
export const OBJECT_NUMBER = {
  prefix: 'Obj ',
  min: 1, // shows as 0001
  max: 9999,
  digits: 4,
}

/**
 * Citizen number (the previous owner): NNN-NNNN-NNNN.
 * Each entry is one group of digits. The first group stays between
 * 001 and 099 so new numbers look like the existing ones.
 */
export const CITIZEN_NUMBER = {
  prefix: 'Citizen ',
  groups: [
    { digits: 3, min: 1, max: 99 },
    { digits: 4, min: 0, max: 9999 },
    { digits: 4, min: 0, max: 9999 },
  ],
  separator: '-',
}

/** Last seen date: a random day between these two dates (inclusive). */
export const LAST_SEEN = {
  from: '2040-01-01',
  to: '2046-10-01',
  separator: '.', // shows as 2045.11.03
}

/** One line is picked at random for each new lot. Add as many as you like. */
export const DESCRIPTION_BANK = [
  'No digital route history is attached to this object.',
  'Recovered from a private residence. Partial record.',
  'Last used three days before Last Seen.',
  "Owner's record is incomplete. Low data object.",
  'Handled daily for over a decade.',
  'No connected history. Analog relic.',
]

/** Object names typed by visitors. */
export const NAME_MAX_LENGTH = 24

// ---------------------------------------------------------------------------
// The functions below use the rules above. You shouldn't need to edit them.
// ---------------------------------------------------------------------------

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pad = (n: number, digits: number) => String(n).padStart(digits, '0')

/** Format a stored object number (e.g. "0816") for display: "Obj 0816". */
export const formatObjNumber = (objNumber: string) => OBJECT_NUMBER.prefix + objNumber

/** Format a stored citizen number for display: "Citizen 031-2290-1174". */
export const formatCitizen = (citizenNumber: string) => CITIZEN_NUMBER.prefix + citizenNumber

/** A random object number not already used in the Archive. */
export function generateObjNumber(taken: Iterable<string>): string {
  const used = new Set(taken)
  const capacity = OBJECT_NUMBER.max - OBJECT_NUMBER.min + 1
  if (used.size >= capacity) throw new Error('The Archive has no object numbers left.')
  let candidate: string
  do {
    candidate = pad(randomInt(OBJECT_NUMBER.min, OBJECT_NUMBER.max), OBJECT_NUMBER.digits)
  } while (used.has(candidate))
  return candidate
}

/** A random citizen number not already used by another lot. */
export function generateCitizenNumber(taken: Iterable<string>): string {
  const used = new Set(taken)
  let candidate: string
  do {
    candidate = CITIZEN_NUMBER.groups
      .map((g) => pad(randomInt(g.min, g.max), g.digits))
      .join(CITIZEN_NUMBER.separator)
  } while (used.has(candidate))
  return candidate
}

/** A random Last seen date, e.g. "2045.11.03". */
export function generateLastSeen(): string {
  const from = Date.parse(LAST_SEEN.from + 'T00:00:00Z')
  const to = Date.parse(LAST_SEEN.to + 'T00:00:00Z')
  const day = 24 * 60 * 60 * 1000
  const d = new Date(from + randomInt(0, Math.floor((to - from) / day)) * day)
  return [d.getUTCFullYear(), pad(d.getUTCMonth() + 1, 2), pad(d.getUTCDate(), 2)].join(
    LAST_SEEN.separator,
  )
}

/** A random line from the description bank. */
export function pickDescription(): string {
  return DESCRIPTION_BANK[randomInt(0, DESCRIPTION_BANK.length - 1)]
}
