import type { AudienceMembership, MultiStatusResponse } from '@segment/actions-core'

export type RawData = {
  context?: {
    personas?: {
      computation_class?: string
    }
  }
  properties?: Record<string, unknown>
}

export interface JourneysMembershipsResult {
  journeyMemberships?: boolean[]
  multiStatusResponse?: MultiStatusResponse
}

export interface MembershipResult {
  resolvedMembership?: AudienceMembership[]
  multiStatusResponse?: MultiStatusResponse
}