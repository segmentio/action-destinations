export interface RipeSDK {
  alias: (userId: string) => Promise<void>
  group: (groupId: string, traits?: Record<string, unknown>) => Promise<void>
  identify: (userId?: string | undefined | null, traits?: Record<string, unknown>) => Promise<void>
  init: (apiKey: string) => Promise<void>
  page: (category?: string, name?: string, properties?: Record<string, unknown>) => Promise<void>
  setIds: (anonymousId: string, userId?: string, groupId?: string) => Promise<void>
  track: (event: string, properties?: Record<string, unknown>) => Promise<void>
}
