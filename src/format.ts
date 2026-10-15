/** "cassette tape" → "Cassette Tape" (cards). */
export const titleCase = (s: string) =>
  s.trim().replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
