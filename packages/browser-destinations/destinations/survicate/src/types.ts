export interface Survicate {
  invokeEvent: (name: string, properties?: Record<string, string>) => void
  setVisitorTraits: (traits: Record<string, unknown>) => void
}
