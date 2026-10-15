import type { Lot } from './types'

/**
 * The six lots that are always in the Archive.
 *
 * Photos: put your cutout PNGs (transparent background) in /public/lots/
 * using the file names below, e.g. public/lots/obj-0816.png.
 * Replacing a file is all it takes; no code changes needed.
 */
const seed = (
  objNumber: string,
  name: string,
  citizenNumber: string,
  description = 'No digital route history is attached to this object.',
): Lot => ({
  id: `seed-${objNumber}`,
  objNumber,
  name,
  citizenNumber,
  lastSeen: '2045.11.03',
  description,
  images: [`/lots/obj-${objNumber}.png`],
  createdAt: '2045-11-03T00:00:00.000Z',
  inherited: false,
  seed: true,
})

export const SEED_LOTS: Lot[] = [
  seed('0816', 'Thumbtack', '031-2290-1174'),
  seed('0917', 'Receipt', '056-1983-8102'),
  seed('0612', 'Cassette tape', '031-2832-1294'),
  seed('1297', 'Clothing tags', '078-4415-6031', 'Recovered from a private residence. Partial record.'),
  seed('1632', 'Earbuds', '012-7740-3389', 'Handled daily for over a decade.'),
  seed('0791', 'Phone', '044-0961-5527', "Owner's record is incomplete. Low data object."),
]
