export interface Audience {
  id: string
  name: string
}
export interface AudienceList {
  audiences: Audience[]
  next_page: string
}
