export interface LinkedInUserAudienceJSON {
  elements: {
    action: 'ADD' | 'REMOVE'
    userIds: LinkedInUserId[]
    firstName?: string
    lastName?: string
    title?: string
    company?: string
    country?: string
  }[]
}

export type LinkedInUserId =
  | { idType: 'SHA256_EMAIL'; idValue: string }
  | { idType: 'GOOGLE_AID'; idValue: string }