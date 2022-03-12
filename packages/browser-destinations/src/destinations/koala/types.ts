export interface KoalaSDK {
  track: (event: string, data?: { [key: string]: unknown }) => Promise<void>
  identify: (traits: Record<string, unknown>) => Promise<void>
}
