import type { Payload } from './generated-types'

export type ValidPayload = Payload & { index: number , isError: boolean }

export interface LinkedInCompanyAudienceJSON {
  elements: {
    action: 'ADD' | 'REMOVE'
    companyIds: ( { idType: 'DOMAIN'; idValue: string } | { idType: 'LINKEDIN_COMPANY_ID'; idValue: string } )[]
  }[]
}