import { PayloadValidationError } from '@segment/actions-core'
import { getJourneysMemberships, updateMembershipIfJourneys } from '../functions'
import { GOOGLE_ENHANCED_CONVERSIONS_AUDIENCE_JOURNEYS_FLAGON } from '../constants'

describe('getJourneysMemberships', () => {
  it('returns undefined when rawDatas is undefined', () => {
    expect(getJourneysMemberships(undefined)).toBeUndefined()
  })

  it('returns undefined when rawDatas is empty', () => {
    expect(getJourneysMemberships([])).toBeUndefined()
  })

  it('returns undefined when no events are journey_step', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(getJourneysMemberships(rawDatas)).toBeUndefined()
  })

  it('returns array of true when all events are journey_step', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    expect(getJourneysMemberships(rawDatas)).toEqual([true, true, true])
  })

  it('throws when batch contains a mix of journey_step and non-journey_step', () => {
    const rawDatas = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(() => getJourneysMemberships(rawDatas)).toThrow(PayloadValidationError)
    expect(() => getJourneysMemberships(rawDatas)).toThrow(
      'Batch contains a mix of journey_step and non-journey_step events.'
    )
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
    const result = updateMembershipIfJourneys({}, memberships, rawData)
    expect(result).toEqual(memberships)
  })

  it('returns journey memberships when flag is enabled and events are journey_step', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const result = updateMembershipIfJourneys(enabledFeatures, memberships, rawData)
    expect(result).toEqual([true, true])
  })

  it('preserves existing boolean memberships even when events are journey_step', () => {
    const memberships = [true, false]
    const rawData = [
      { context: { personas: { computation_class: 'journey_step' } } },
      { context: { personas: { computation_class: 'journey_step' } } }
    ]
    const result = updateMembershipIfJourneys(enabledFeatures, memberships, rawData)
    expect(result).toEqual([true, false])
  })

  it('returns original memberships when events are not journey_step', () => {
    const memberships = [undefined, undefined]
    const rawData = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    const result = updateMembershipIfJourneys(enabledFeatures, memberships, rawData)
    expect(result).toEqual(memberships)
  })

  it('returns original memberships when rawData is undefined', () => {
    const memberships = [undefined, true]
    const result = updateMembershipIfJourneys(enabledFeatures, memberships, undefined)
    expect(result).toEqual(memberships)
  })
})
