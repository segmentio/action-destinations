import { PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import { getJourneysMemberships, updateMembershipIfJourneys } from '../functions'
import { GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON } from '../constants'
import type { Payload } from '../generated-types'

const mockPayload = { ad_user_data_consent_state: 'GRANTED', ad_personalization_consent_state: 'GRANTED' } as Payload

describe('getJourneysMemberships', () => {
  it('returns empty result when rawDatas is undefined', () => {
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(false, [mockPayload], undefined)
    expect(journeyMemberships).toBeUndefined()
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns empty result when rawDatas is empty', () => {
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(false, [mockPayload], [])
    expect(journeyMemberships).toBeUndefined()
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns empty result when no events are journey_step', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(false, [mockPayload, mockPayload], rawDatas)
    expect(journeyMemberships).toBeUndefined()
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns journeyMemberships when all events are journey_step', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(false, [mockPayload, mockPayload, mockPayload], rawDatas)
    expect(journeyMemberships).toEqual([true, true, true])
    expect(multiStatusResponse).toBeUndefined()
  })

  it('throws PayloadValidationError for mixed batch when isBatch is false', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(() => getJourneysMemberships(false, [mockPayload, mockPayload], rawDatas)).toThrow(PayloadValidationError)
    expect(() => getJourneysMemberships(false, [mockPayload, mockPayload], rawDatas)).toThrow(
      'Batch contains a mix of journey_step and non-journey_step events.'
    )
  })

  it('returns multiStatusResponse for mixed batch when isBatch is true', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    const { journeyMemberships, multiStatusResponse } = getJourneysMemberships(true, [mockPayload, mockPayload], rawDatas)
    expect(multiStatusResponse).toBeInstanceOf(MultiStatusResponse)
    expect(journeyMemberships).toBeUndefined()
  })
})

describe('updateMembershipIfJourneys', () => {
  const enabledFeatures = { [GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON]: true }

  it('returns original memberships when feature flag is disabled', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], {}, memberships, rawData)
    expect(resolvedMembership).toEqual(memberships)
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns journey memberships when flag is enabled and events are journey_step', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], enabledFeatures, memberships, rawData)
    expect(resolvedMembership).toEqual([true, true])
    expect(multiStatusResponse).toBeUndefined()
  })

  it('preserves existing boolean memberships even when events are journey_step', () => {
    const memberships: Array<boolean | undefined> = [true, false]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], enabledFeatures, memberships, rawData)
    expect(resolvedMembership).toEqual([true, false])
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns original memberships when events are not journey_step', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], enabledFeatures, memberships, rawData)
    expect(resolvedMembership).toEqual(memberships)
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns original memberships when rawData is undefined', () => {
    const memberships = [undefined, true]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], enabledFeatures, memberships, undefined)
    expect(resolvedMembership).toEqual(memberships)
    expect(multiStatusResponse).toBeUndefined()
  })

  it('returns multiStatusResponse for mixed batch when isBatch is true', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    const { resolvedMembership, multiStatusResponse } = updateMembershipIfJourneys(true, [mockPayload, mockPayload], enabledFeatures, memberships, rawData)
    expect(multiStatusResponse).toBeInstanceOf(MultiStatusResponse)
    expect(resolvedMembership).toBeUndefined()
  })
})
