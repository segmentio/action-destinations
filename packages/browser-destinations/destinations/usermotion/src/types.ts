export type UserMotion = {
  identify: (userId: String, traits?: { [key: string]: unknown }) => void
  track: (eventName: String, eventProperties?: { [key: string]: unknown }) => void
  group: (groupId: String, groupTraits: { [key: string]: unknown }) => void
  pageview: (properties?: Object) => void
}
