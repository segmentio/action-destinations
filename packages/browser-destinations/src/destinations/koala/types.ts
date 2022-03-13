export interface KoalaSDK {
  segmentHooked?: boolean
  ready: (fn?: () => Promise<unknown> | unknown) => Promise<void>
  track: (event: string, data?: { [key: string]: unknown }) => Promise<void>
  identify: (traits: Record<string, unknown>) => Promise<void>
}
