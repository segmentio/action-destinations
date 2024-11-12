export type Userpilot = {
  identify: (user_id: String, traits: { [key: string]: unknown }) => void
  track: (eventName: String, eventProperties: { [key: string]: unknown }) => void
  reload: (pageName: String, pageProperties: Object) => void
  group: (groupId: String, groupTraits: Object) => void
}
