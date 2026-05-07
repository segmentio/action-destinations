import { getJourneysMemberships } from '../functions'
import { RawData } from '../types'

describe('getJourneysMemberships', () => {
  it('returns undefined when rawDatas is undefined', () => {
    expect(getJourneysMemberships(undefined)).toBeUndefined()
  })

  it('returns undefined when rawDatas is an empty array', () => {
    expect(getJourneysMemberships([])).toBeUndefined()
  })

  it('returns undefined when no events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'audience' } } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(getJourneysMemberships(rawDatas)).toBeUndefined()
  })

  it('returns an array of true values when all events are journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } }, properties: { step_1: true } },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } }, properties: { step_1: true } },
      { context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } }, properties: { step_1: false } }
    ]
    const result = getJourneysMemberships(rawDatas)
    expect(result).toEqual([true, true, true])
    expect(result).toHaveLength(3)
  })

  it('throws PayloadValidationError when batch contains a mix of journey_step and non-journey_step', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } }, properties: { step_1: true } },
      { context: { personas: { computation_class: 'audience' } } }
    ]
    expect(() => getJourneysMemberships(rawDatas)).toThrow(
      'Batch contains a mix of journey_step and non-journey_step events. All events in a batch must be the same computation_class.'
    )
  })

  it('returns array matching rawDatas length for single event', () => {
    const rawDatas: RawData[] = [
      { context: { personas: { computation_class: 'journey_step', computation_key: 'step_1' } }, properties: { step_1: true } }
    ]
    const result = getJourneysMemberships(rawDatas)
    expect(result).toEqual([true])
  })
})
