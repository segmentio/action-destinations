import { RawData, JourneysMembershipsResult, MembershipResult } from './types'
import { PayloadValidationError, Features, AudienceMembership, MultiStatusResponse, ErrorCodes, JSONLikeObject } from '@segment/actions-core'
import { GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON } from './constants'
import type { Payload } from './generated-types'

export function getJourneysMemberships(
  isBatch: boolean,
  payloads: Payload[],
  rawDatas?: RawData[]
): JourneysMembershipsResult {
  if (!rawDatas || rawDatas.length === 0) {
    return {}
  }

  const isJourneyStep = rawDatas.map((raw) => raw?.context?.personas?.computation_class === 'journey_step')
  const allJourney = isJourneyStep.every(Boolean)
  const noneJourney = isJourneyStep.every((v) => !v)

  if (!allJourney && !noneJourney) {
    const message =
      'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    if (!isBatch) {
      throw new PayloadValidationError(message)
    }
    const msResponse = new MultiStatusResponse()
    payloads.forEach((payload, index) => {
      msResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: ErrorCodes.BAD_REQUEST,
        errormessage: message,
        sent: payload as unknown as JSONLikeObject
      })
    })
    return { multiStatusResponse: msResponse }
  }

  if (noneJourney) {
    return {}
  }

  return { journeyMemberships: new Array(rawDatas.length).fill(true) }
}

export function updateMembershipIfJourneys(
  isBatch: boolean,
  payloads: Payload[],
  features?: Features,
  audienceMemberships?: AudienceMembership[],
  rawData?: RawData[]
): MembershipResult {
  if (features && features[GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON]) {
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(isBatch, payloads, rawData)
    if (multiStatusResponse) {
      return { multiStatusResponse }
    }
    if (journeyMemberships && journeyMemberships.length > 0) {
      // If audienceMemberships are already resolved booleans, preserve them (future JourneysV2 preset support)
      if (!audienceMemberships?.every((m) => typeof m === 'boolean')) {
        return { resolvedMembership: journeyMemberships }
      }
    }
  }
  return { resolvedMembership: audienceMemberships }
}
