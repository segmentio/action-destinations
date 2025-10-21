export interface LinkedInUserAudienceJSON {
  elements: {
    action: 'ADD' | 'REMOVE'
    userIds: ( { idType: 'SHA256_EMAIL'; idValue: string } | { idType: 'GOOGLE_AID'; idValue: string } )[]
    firstName?: string
    lastName?: string
    title?: string
    company?: string
    country?: string
  }[]
}