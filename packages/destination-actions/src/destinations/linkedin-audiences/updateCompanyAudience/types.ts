import type { Payload } from './generated-types'
import { SEGMENT_TYPES, AUDIENCE_ACTION } from './constants'

export type SegmentType = typeof SEGMENT_TYPES[keyof typeof SEGMENT_TYPES]

export type AudienceAction = typeof AUDIENCE_ACTION[keyof typeof AUDIENCE_ACTION]

export interface LinkedInCompanyAudienceElement {
  action: AudienceAction
  companyWebsiteDomain?: string
  organizationUrn?: string
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

export type ValidCompanyPayload = Payload & { index: number }
