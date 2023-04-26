export interface Koala {
  ready: (fn?: () => Promise<unknown> | unknown) => Promise<void>
  track: (event: string, data?: { [key: string]: unknown }) => Promise<void>
  identify: (traits: Record<string, unknown>) => Promise<void>
}

export interface KoalaSDK {
  load: (options: { project: string; hookSegment?: boolean }) => Promise<Koala>
}
