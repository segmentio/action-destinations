import type { Payload } from './generated-types'
import { SEGMENT_TYPES, AUDIENCE_ACTION } from './constants'

export type SegmentType = typeof SEGMENT_TYPES[keyof typeof SEGMENT_TYPES]

export type AudienceAction = typeof AUDIENCE_ACTION[keyof typeof AUDIENCE_ACTION]

export interface LinkedInCompanyAudienceElement {
  action: AudienceAction
  companyName?: string
  companyWebsiteDomain?: string
  companyEmailDomain?: string
  organizationUrn?: string
  companyPageUrl?: string
  industries?: string[]
  city?: string
  state?: string
  country?: string
  postalCode?: string
  stockSymbol?: string
}

export interface AudienceJSON<E> {
  elements: E[]
}

export interface DMPSegment {
  id: string
  name: string
  type: SegmentType
}

export interface GetDMPSegmentsResponse {
  elements: DMPSegment[]
}

export interface LinkedInBatchUpdateResponse {
  elements: Array<{
    status: number
    id?: string
    error?: {
      message?: string
      status?: number
    }
  }>
}

// The identifiers and traits carried by a validated payload are the cleaned values, not the raw
// mapped ones: a value that breached a LinkedIn limit has already been dropped by this point.
export interface NormalizedIdentifiers {
  companyName?: string
  companyDomain?: string
  companyEmailDomain?: string
  linkedInCompanyId?: string
  companyPageUrl?: string
}

export interface NormalizedTraits {
  industries?: string[]
  city?: string
  state?: string
  country?: string
  postalCode?: string
  stockSymbol?: string
}

export type ValidCompanyPayload = Omit<Payload, 'identifiers' | 'company_traits'> & {
  index: number
  identifiers: NormalizedIdentifiers
  company_traits?: NormalizedTraits
}
