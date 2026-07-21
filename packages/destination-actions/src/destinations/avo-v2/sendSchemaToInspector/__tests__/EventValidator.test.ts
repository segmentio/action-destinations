import { validateEvent } from '../functions/event-validator-functions'
import type { EventSpec } from '../types'

describe('EventValidator', () => {
  const mockSpec: EventSpec = {
    metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
    events: [
      {
        branchId: 'main',
        baseEventId: 'evt_1',
        variantIds: [],
        props: {
          strProp: {
            type: 'string',
            required: true,
            allowedValues: { '["a","b"]': ['evt_1'] }
          },
          listProp: {
            type: 'int',
            required: true,
            isList: true,
            minMaxRanges: { '0,10': ['evt_1'] }
          },
          objProp: {
            type: 'object',
            required: true,
            children: {
              childStr: {
                type: 'string',
                required: true,
                pinnedValues: { pinned: ['evt_1'] }
              }
            }
          },
          listObjProp: {
            type: 'object',
            required: true,
            isList: true,
            children: {
              id: {
                type: 'string',
                required: true,
                pinnedValues: { id_1: ['evt_1'] }
              }
            }
          }
        }
      }
    ]
  }

  it('validates allowed values for string property', () => {
    const result = validateEvent({ strProp: 'a' }, mockSpec)
    expect(result.propertyResults.strProp).toEqual({}) // Pass

    const resultFail = validateEvent({ strProp: 'c' }, mockSpec)
    expect(resultFail.propertyResults.strProp.failedEventIds).toEqual(['evt_1'])
  })

  it('validates list of primitives (min/max)', () => {
    const result = validateEvent({ listProp: [5, 0, 10] }, mockSpec)
    expect(result.propertyResults.listProp).toEqual({}) // Pass

    const resultFail = validateEvent({ listProp: [5, 11] }, mockSpec)
    expect(resultFail.propertyResults.listProp.failedEventIds).toEqual(['evt_1'])
  })

  it('validates object property with recursion', () => {
    const result = validateEvent({ objProp: { childStr: 'pinned' } }, mockSpec)
    expect(result.propertyResults.objProp).toEqual({}) // Pass

    const resultFail = validateEvent({ objProp: { childStr: 'wrong' } }, mockSpec)
    expect(resultFail.propertyResults.objProp.children?.childStr.failedEventIds).toEqual(['evt_1'])
  })

  it('validates list of objects', () => {
    const result = validateEvent({ listObjProp: [{ id: 'id_1' }, { id: 'id_1' }] }, mockSpec)
    expect(result.propertyResults.listObjProp).toEqual({}) // Pass

    const resultFail = validateEvent({ listObjProp: [{ id: 'id_1' }, { id: 'wrong' }] }, mockSpec)
    expect(resultFail.propertyResults.listObjProp.children?.id.failedEventIds).toEqual(['evt_1'])
  })

  it('handles depth limit', () => {
    // Create deep structure
    const deepSpec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            l1: {
              type: 'object',
              required: true,
              children: {
                l2: {
                  type: 'object',
                  required: true,
                  children: {
                    l3: {
                      type: 'string',
                      required: true,
                      pinnedValues: { val: ['evt_1'] }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }

    // Depth limit is 2 (l1 -> l2 -> l3 is depth 0 -> 1 -> 2)
    // l3 validation should be skipped
    const result = validateEvent({ l1: { l2: { l3: 'wrong' } } }, deepSpec)
    expect(result.propertyResults.l1).toEqual({})
  })

  it('validates unbounded min/max', () => {
    const unboundedSpec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            minOnly: {
              type: 'int',
              required: true,
              minMaxRanges: { '10,': ['evt_1'] }
            },
            maxOnly: {
              type: 'int',
              required: true,
              minMaxRanges: { ',20': ['evt_1'] }
            }
          }
        }
      ]
    }

    expect(validateEvent({ minOnly: 10 }, unboundedSpec).propertyResults.minOnly).toEqual({})
    expect(validateEvent({ minOnly: 100 }, unboundedSpec).propertyResults.minOnly).toEqual({})
    expect(validateEvent({ minOnly: 9 }, unboundedSpec).propertyResults.minOnly.failedEventIds).toEqual(['evt_1'])

    expect(validateEvent({ maxOnly: 20 }, unboundedSpec).propertyResults.maxOnly).toEqual({})
    expect(validateEvent({ maxOnly: -100 }, unboundedSpec).propertyResults.maxOnly).toEqual({})
    expect(validateEvent({ maxOnly: 21 }, unboundedSpec).propertyResults.maxOnly.failedEventIds).toEqual(['evt_1'])
  })

  it('skips validation for optional properties with null/undefined values', () => {
    const optionalSpec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            optionalProp: {
              type: 'string',
              required: false,
              allowedValues: { '["valid"]': ['evt_1'] }
            }
          }
        }
      ]
    }

    // Should pass validation when null
    const resultNull = validateEvent({ optionalProp: null }, optionalSpec)
    expect(resultNull.propertyResults.optionalProp).toEqual({})

    // Should pass validation when undefined
    const resultUndefined = validateEvent({ optionalProp: undefined }, optionalSpec)
    expect(resultUndefined.propertyResults.optionalProp).toEqual({})

    // Should pass validation when value is valid
    const resultValid = validateEvent({ optionalProp: 'valid' }, optionalSpec)
    expect(resultValid.propertyResults.optionalProp).toEqual({})

    // Should fail validation when value is invalid (and not null/undefined)
    const resultInvalid = validateEvent({ optionalProp: 'invalid' }, optionalSpec)
    expect(resultInvalid.propertyResults.optionalProp.failedEventIds).toEqual(['evt_1'])
  })
})
