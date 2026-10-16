/** One catalogued object in the Archive. */
export interface Lot {
  id: string
  /** Four digits, e.g. "0816". Shown as "Obj 0816". */
  objNumber: string
  /** As typed, e.g. "Cassette tape". */
  name: string
  /** e.g. "031-2290-1174". Shown as "Citizen 031-2290-1174". */
  citizenNumber: string
  /** e.g. "2045.11.03" */
  lastSeen: string
  description: string
  /** 1 photo, or 8 for a turntable. A URL (seed lots) or a stored photo (visitor lots). */
  images: (string | Blob)[]
  /** Optional 3D model (.glb). */
  model?: string | Blob
  /** ISO timestamp. */
  createdAt: string
  inherited: boolean
  /**
   * Active: belongs to a living citizen (everything visitors scan).
   * Archive: its owner is Last Seen. Missing means active.
   */
  status?: 'active' | 'archive'
  /** Seed lots are part of the exhibit and survive a Reset Archive. */
  seed?: boolean
}
