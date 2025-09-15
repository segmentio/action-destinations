export interface Survicate {
  invokeEvent: (name: string, properties?: { [k: string]: unknown }) => void
  setVisitorTraits: (traits: { [k: string]: unknown }) => void
}
