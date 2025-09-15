export interface PlayerZero {
  identify: (userId: string, metadata: Record<string, unknown>) => void
  setUserVars: (metadata: Record<string, unknown>) => void
  track: (event: string, metadata?: Record<string, unknown>) => void
}
