export interface AudienceList {
  audiences: {
    id: string
    name: string
  }[]
}

export interface UpdateAudienceRequest {
  audience_id: string
  contact_ids: string[]
}
