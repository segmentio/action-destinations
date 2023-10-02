export type UserMotion = {
  identify: (userId: String, traits: { [key: string]: unknown }) => void
  track: (eventName: String, eventProperties: { [key: string]: unknown }) => void
  group: (groupId: String, groupTraits: Object) => void
  pageview: (properties: Object) => void
}
