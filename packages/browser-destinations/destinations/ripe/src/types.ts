export interface RipeSDK {
  group: ({
    anonymousId,
    userId,
    messageId,
    groupId,
    traits
  }: {
    messageId?: string
    anonymousId: string
    userId?: string | null
    groupId: string | null
    traits?: Record<string, unknown>
  }) => Promise<void>
  identify: ({
    messageId,
    anonymousId,
    userId,
    groupId,
    traits
  }: {
    messageId?: string
    anonymousId: string
    userId?: string | null
    groupId?: string | null
    traits?: Record<string, unknown>
  }) => Promise<void>
  init: (apiKey: string) => Promise<void>
  page: ({
    messageId,
    anonymousId,
    userId,
    groupId,
    category,
    name,
    properties
  }: {
    messageId?: string
    anonymousId: string
    userId?: string | null
    groupId?: string | null
    category?: string
    name?: string
    properties?: Record<string, unknown>
  }) => Promise<void>
  track: ({
    messageId,
    anonymousId,
    userId,
    groupId,
    event,
    properties
  }: {
    messageId?: string
    anonymousId: string
    userId?: string | null
    groupId?: string | null
    event: string
    properties?: Record<string, unknown>
  }) => Promise<void>
}
