export interface RipeSDK {
  group: ({
    messageId,
    groupId,
    traits
  }: {
    messageId?: string
    groupId: string
    traits?: Record<string, unknown>
  }) => Promise<void>
  identify: ({
    messageId,
    userId,
    traits
  }: {
    messageId?: string
    userId?: string
    traits?: Record<string, unknown>
  }) => Promise<void>
  init: (apiKey: string) => Promise<void>
  page: ({
    messageId,
    category,
    name,
    properties
  }: {
    messageId?: string
    category?: string
    name?: string
    properties?: Record<string, unknown>
  }) => Promise<void>
  setIds: (anonymousId: string, userId?: string, groupId?: string) => Promise<void>
  track: ({
    messageId,
    event,
    properties
  }: {
    messageId?: string
    event: string
    properties?: Record<string, unknown>
  }) => Promise<void>
}
