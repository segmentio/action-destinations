import { RawData } from './types'
import { PayloadValidationError, Features, AudienceMembership } from '@segment/actions-core'
import { GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON } from './constants'

export function getJourneysMemberships(
  rawDatas?: RawData[] | undefined
): boolean[] | undefined {
  if (!rawDatas || (Array.isArray(rawDatas) && rawDatas.length === 0)) {
    return undefined
  }

  const isJourneyStep = rawDatas.map((raw) => raw?.context?.personas?.computation_class === 'journey_step')
  const allJourney = isJourneyStep.every(Boolean)
  const noneJourney = isJourneyStep.every((v) => !v)

  if (!allJourney && !noneJourney) {
    throw new PayloadValidationError('Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.')
  } 

  if (noneJourney) {
    return undefined
  }

  return new Array(rawDatas.length).fill(true)
}

export function updateMembershipIfJourneys(features?: Features, audienceMemberships?: AudienceMembership[], rawData?: RawData[]): AudienceMembership[] | undefined {
  if (features && features[GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON]) {
    const journeyMemberships = getJourneysMemberships(rawData)
    if (Array.isArray(journeyMemberships) && journeyMemberships.length > 0) {
      // If audienceMemberships are already resolved booleans, preserve them (future JourneysV2 preset support)
      if (!audienceMemberships?.every((m) => typeof m === 'boolean')) {
        return journeyMemberships
      }
    }
  }
  return audienceMemberships
}
