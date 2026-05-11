import { Features } from '@segment/actions-core'
import { GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON } from './constants'
import type { Payload } from './generated-types'

export function membershipsIfLegacyJourneys(
  payloads: Payload[],
  computationClass?: string,
  computationKey?: string,
  features?: Features
){
  if (features && features[GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON]) {
    if(computationClass === 'journeys' && !computationKey) {
      // This is a legacy Journeys computation. Only adds are supported
      return payloads.map(() => true)
    }
  }
  return undefined 
}
