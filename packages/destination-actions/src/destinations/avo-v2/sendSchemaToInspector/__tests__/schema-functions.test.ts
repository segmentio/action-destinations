import { extractSchema } from '../functions/schema-functions'
import { mergeValidationResults } from '../functions/functions'
import { validateEvent } from '../functions/event-validator-functions'
import type { EventProperty, EventSpec, PropertyValidationResult } from '../types'

describe('extractSchema', () => {
  describe('edge case types', () => {
    it('handles null and undefined values', () => {
      const result = extractSchema({
        nullProp: null,
        undefinedProp: undefined
      })

      expect(result).toEqual([
        { propertyName: 'nullProp', propertyType: 'null' },
        { propertyName: 'undefinedProp', propertyType: 'null' }
      ])
    })

    it('handles empty object', () => {
      const result = extractSchema({})
      expect(result).toEqual([])
    })

    it('handles null input', () => {
      const result = extractSchema(null as unknown as Record<string, unknown>)
      expect(result).toEqual([])
    })

    it('handles undefined input', () => {
      const result = extractSchema(undefined as unknown as Record<string, unknown>)
      expect(result).toEqual([])
    })

    it('handles bigint values', () => {
      const result = extractSchema({
        bigIntProp: BigInt(9007199254740991)
      })

      expect(result).toEqual([{ propertyName: 'bigIntProp', propertyType: 'int' }])
    })

    it('handles bigint with decimal representation', () => {
      // BigInt.toString() never includes a decimal point, so this tests the int path
      const result = extractSchema({
        bigIntProp: BigInt(123)
      })

      expect(result).toEqual([{ propertyName: 'bigIntProp', propertyType: 'int' }])
    })

    it('handles symbol values as unknown type', () => {
      const result = extractSchema({
        symbolProp: Symbol('test')
      })

      expect(result).toEqual([{ propertyName: 'symbolProp', propertyType: 'unknown' }])
    })

    it('handles function values as unknown type', () => {
      const result = extractSchema({
        funcProp: () => {}
      })

      expect(result).toEqual([{ propertyName: 'funcProp', propertyType: 'unknown' }])
    })

    it('handles float numbers', () => {
      const result = extractSchema({
        floatProp: 3.14159,
        negativeFloat: -0.5
      })

      expect(result).toContainEqual({ propertyName: 'floatProp', propertyType: 'float' })
      expect(result).toContainEqual({ propertyName: 'negativeFloat', propertyType: 'float' })
    })

    it('handles integer numbers', () => {
      const result = extractSchema({
        intProp: 42,
        negativeInt: -100,
        zero: 0
      })

      expect(result).toContainEqual({ propertyName: 'intProp', propertyType: 'int' })
      expect(result).toContainEqual({ propertyName: 'negativeInt', propertyType: 'int' })
      expect(result).toContainEqual({ propertyName: 'zero', propertyType: 'int' })
    })

    it('handles special float values', () => {
      const result = extractSchema({
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN
      })

      // Infinity.toString() = "Infinity" (no decimal)
      expect(result).toContainEqual({ propertyName: 'infinity', propertyType: 'int' })
      expect(result).toContainEqual({ propertyName: 'negInfinity', propertyType: 'int' })
      expect(result).toContainEqual({ propertyName: 'nan', propertyType: 'int' })
    })

    it('handles boolean values', () => {
      const result = extractSchema({
        trueProp: true,
        falseProp: false
      })

      expect(result).toContainEqual({ propertyName: 'trueProp', propertyType: 'boolean' })
      expect(result).toContainEqual({ propertyName: 'falseProp', propertyType: 'boolean' })
    })

    it('handles string values', () => {
      const result = extractSchema({
        emptyString: '',
        normalString: 'hello world',
        unicodeString: '日本語'
      })

      expect(result).toContainEqual({ propertyName: 'emptyString', propertyType: 'string' })
      expect(result).toContainEqual({ propertyName: 'normalString', propertyType: 'string' })
      expect(result).toContainEqual({ propertyName: 'unicodeString', propertyType: 'string' })
    })
  })

  describe('arrays', () => {
    it('handles empty arrays', () => {
      const result = extractSchema({
        emptyArray: []
      })

      expect(result).toEqual([{ propertyName: 'emptyArray', propertyType: 'list', children: [] }])
    })

    it('handles arrays with primitive types', () => {
      const result = extractSchema({
        stringArray: ['a', 'b', 'c']
      })

      expect(result).toEqual([{ propertyName: 'stringArray', propertyType: 'list', children: ['string'] }])
    })

    it('handles arrays with duplicate types (deduplication)', () => {
      const result = extractSchema({
        mixedInts: [1, 2, 3, 4, 5]
      })

      expect(result).toEqual([{ propertyName: 'mixedInts', propertyType: 'list', children: ['int'] }])
    })

    it('handles arrays with mixed primitive types', () => {
      const result = extractSchema({
        mixedArray: [1, 'string', true, null]
      })

      const mixedArrayResult = result.find((p) => p.propertyName === 'mixedArray')
      expect(mixedArrayResult?.propertyType).toBe('list')
      expect(mixedArrayResult?.children).toContain('int')
      expect(mixedArrayResult?.children).toContain('string')
      expect(mixedArrayResult?.children).toContain('boolean')
      expect(mixedArrayResult?.children).toContain('null')
    })

    it('handles arrays of objects', () => {
      const result = extractSchema({
        objectArray: [{ id: 1 }, { id: 2 }]
      })

      const objectArrayResult = result.find((p) => p.propertyName === 'objectArray')
      expect(objectArrayResult?.propertyType).toBe('list')
      expect(objectArrayResult?.children).toHaveLength(1) // Deduplicated to single schema
    })

    it('handles nested arrays', () => {
      const result = extractSchema({
        nestedArray: [
          [1, 2],
          [3, 4]
        ]
      })

      expect(result).toEqual([
        {
          propertyName: 'nestedArray',
          propertyType: 'list',
          children: [['int']]
        }
      ])
    })

    it('handles arrays with objects having different keys (deduplicates to single schema)', () => {
      const result = extractSchema({
        mixedObjectArray: [{ a: 1 }, { b: 2 }]
      })

      const mixedResult = result.find((p) => p.propertyName === 'mixedObjectArray')
      expect(mixedResult?.propertyType).toBe('list')
      expect(Array.isArray(mixedResult?.children)).toBe(true)
      // Note: Due to JSON.stringify replacer behavior with arrays, objects with different keys
      // are deduplicated into a single schema representation. This matches Web SDK behavior.
      expect((mixedResult?.children as unknown[]).length).toBe(1)
    })

    it('handles arrays with same-keyed objects having different values (deduplicates by structure)', () => {
      const result = extractSchema({
        sameKeyArray: [{ id: 1 }, { id: 2 }]
      })

      const sameKeyResult = result.find((p) => p.propertyName === 'sameKeyArray')
      expect(sameKeyResult?.propertyType).toBe('list')
      expect(Array.isArray(sameKeyResult?.children)).toBe(true)
      // Same structure (same keys), so deduplicates to 1
      expect((sameKeyResult?.children as unknown[]).length).toBe(1)
    })
  })

  describe('objects', () => {
    it('handles nested objects', () => {
      const result = extractSchema({
        outerObj: {
          innerObj: {
            value: 'deep'
          }
        }
      })

      const outerObj = result.find((p) => p.propertyName === 'outerObj')
      expect(outerObj?.propertyType).toBe('object')
      expect(Array.isArray(outerObj?.children)).toBe(true)
      const innerObj = (outerObj?.children as EventProperty[]).find((c) => c.propertyName === 'innerObj')
      expect(innerObj?.propertyType).toBe('object')
    })

    it('handles deeply nested structures (5 levels)', () => {
      const result = extractSchema({
        l1: {
          l2: {
            l3: {
              l4: {
                l5: 'deep value'
              }
            }
          }
        }
      })

      const l1 = result.find((p) => p.propertyName === 'l1')
      expect(l1?.propertyType).toBe('object')
      const l2 = (l1?.children as EventProperty[]).find((c) => c.propertyName === 'l2')
      expect(l2?.propertyType).toBe('object')
      const l3 = (l2?.children as EventProperty[]).find((c) => c.propertyName === 'l3')
      expect(l3?.propertyType).toBe('object')
      const l4 = (l3?.children as EventProperty[]).find((c) => c.propertyName === 'l4')
      expect(l4?.propertyType).toBe('object')
      const l5 = (l4?.children as EventProperty[]).find((c) => c.propertyName === 'l5')
      expect(l5?.propertyType).toBe('string')
    })

    it('handles object with empty nested object', () => {
      const result = extractSchema({
        outer: {
          empty: {}
        }
      })

      const outer = result.find((p) => p.propertyName === 'outer')
      expect(outer?.propertyType).toBe('object')
      const empty = (outer?.children as EventProperty[]).find((c) => c.propertyName === 'empty')
      expect(empty?.propertyType).toBe('object')
      expect(empty?.children).toEqual([])
    })

    it('handles circular references in objects gracefully', () => {
      const circularObj: Record<string, unknown> = { name: 'test' }
      circularObj.self = circularObj // Create circular reference

      // Should not throw - circular references are detected and short-circuited
      const result = extractSchema({ circular: circularObj })

      const circularProp = result.find((p) => p.propertyName === 'circular')
      expect(circularProp?.propertyType).toBe('object')
      expect(Array.isArray(circularProp?.children)).toBe(true)

      const children = circularProp?.children as EventProperty[]
      expect(children.find((c) => c.propertyName === 'name')?.propertyType).toBe('string')
      // The circular 'self' reference returns 'object' type without children (breaks the cycle)
      const selfProp = children.find((c) => c.propertyName === 'self')
      expect(selfProp?.propertyType).toBe('object')
      expect(selfProp?.children).toBe('object') // Short-circuited to just the type string
    })

    it('handles circular references in arrays gracefully', () => {
      const circularArray: unknown[] = [1, 2]
      circularArray.push(circularArray) // Array contains itself

      const result = extractSchema({ items: circularArray })

      const itemsProp = result.find((p) => p.propertyName === 'items')
      expect(itemsProp?.propertyType).toBe('list')
      // Should have processed the primitives and short-circuited the circular ref
      expect(Array.isArray(itemsProp?.children)).toBe(true)
    })
  })
})

describe('mergeValidationResults', () => {
  it('merges failedEventIds into matching properties', () => {
    const eventProperties: EventProperty[] = [
      { propertyName: 'prop1', propertyType: 'string' },
      { propertyName: 'prop2', propertyType: 'int' }
    ]

    const propertyResults: Record<string, PropertyValidationResult> = {
      prop1: { failedEventIds: ['evt_1', 'evt_2'] },
      prop2: {}
    }

    mergeValidationResults(eventProperties, propertyResults)

    expect(eventProperties[0].failedEventIds).toEqual(['evt_1', 'evt_2'])
    expect(eventProperties[1].failedEventIds).toBeUndefined()
  })

  it('merges passedEventIds into matching properties', () => {
    const eventProperties: EventProperty[] = [{ propertyName: 'prop1', propertyType: 'string' }]

    const propertyResults: Record<string, PropertyValidationResult> = {
      prop1: { passedEventIds: ['evt_3'] }
    }

    mergeValidationResults(eventProperties, propertyResults)

    expect(eventProperties[0].passedEventIds).toEqual(['evt_3'])
  })

  it('does not add empty arrays', () => {
    const eventProperties: EventProperty[] = [{ propertyName: 'prop1', propertyType: 'string' }]

    const propertyResults: Record<string, PropertyValidationResult> = {
      prop1: { failedEventIds: [], passedEventIds: [] }
    }

    mergeValidationResults(eventProperties, propertyResults)

    expect(eventProperties[0].failedEventIds).toBeUndefined()
    expect(eventProperties[0].passedEventIds).toBeUndefined()
  })

  it('handles properties not in validation results', () => {
    const eventProperties: EventProperty[] = [
      { propertyName: 'validatedProp', propertyType: 'string' },
      { propertyName: 'unknownProp', propertyType: 'int' }
    ]

    const propertyResults: Record<string, PropertyValidationResult> = {
      validatedProp: { failedEventIds: ['evt_1'] }
      // unknownProp not in results
    }

    mergeValidationResults(eventProperties, propertyResults)

    expect(eventProperties[0].failedEventIds).toEqual(['evt_1'])
    expect(eventProperties[1].failedEventIds).toBeUndefined()
  })

  it('recursively merges nested children', () => {
    const eventProperties: EventProperty[] = [
      {
        propertyName: 'outerProp',
        propertyType: 'object',
        children: [{ propertyName: 'innerProp', propertyType: 'string' }]
      }
    ]

    const propertyResults: Record<string, PropertyValidationResult> = {
      outerProp: {
        children: {
          innerProp: { failedEventIds: ['evt_nested'] }
        }
      }
    }

    mergeValidationResults(eventProperties, propertyResults)

    const children = eventProperties[0].children as EventProperty[]
    expect(children[0].failedEventIds).toEqual(['evt_nested'])
  })

  it('handles deeply nested validation results', () => {
    const eventProperties: EventProperty[] = [
      {
        propertyName: 'l1',
        propertyType: 'object',
        children: [
          {
            propertyName: 'l2',
            propertyType: 'object',
            children: [{ propertyName: 'l3', propertyType: 'string' }]
          }
        ]
      }
    ]

    const propertyResults: Record<string, PropertyValidationResult> = {
      l1: {
        children: {
          l2: {
            children: {
              l3: { failedEventIds: ['evt_deep'] }
            }
          }
        }
      }
    }

    mergeValidationResults(eventProperties, propertyResults)

    const l1Children = eventProperties[0].children as EventProperty[]
    const l2Children = l1Children[0].children as EventProperty[]
    expect(l2Children[0].failedEventIds).toEqual(['evt_deep'])
  })

  it('handles mixed children (strings and EventProperty objects)', () => {
    // SchemaChild can be string | EventProperty | SchemaChild[]
    // mergeValidationResults should filter to only EventProperty
    const eventProperties: EventProperty[] = [
      {
        propertyName: 'arrayProp',
        propertyType: 'list',
        children: ['string', { propertyName: 'objectChild', propertyType: 'int' }] as EventProperty['children']
      }
    ]

    const propertyResults: Record<string, PropertyValidationResult> = {
      arrayProp: {
        children: {
          objectChild: { failedEventIds: ['evt_child'] }
        }
      }
    }

    // Should not throw and should merge correctly
    mergeValidationResults(eventProperties, propertyResults)

    const children = eventProperties[0].children as unknown[]
    const objectChild = children.find(
      (c) => typeof c === 'object' && c !== null && (c as EventProperty).propertyName === 'objectChild'
    ) as EventProperty
    expect(objectChild.failedEventIds).toEqual(['evt_child'])
  })

  it('handles empty eventProperties array', () => {
    const eventProperties: EventProperty[] = []
    const propertyResults: Record<string, PropertyValidationResult> = {
      someProp: { failedEventIds: ['evt_1'] }
    }

    // Should not throw
    mergeValidationResults(eventProperties, propertyResults)
    expect(eventProperties).toEqual([])
  })

  it('handles empty propertyResults', () => {
    const eventProperties: EventProperty[] = [{ propertyName: 'prop1', propertyType: 'string' }]
    const propertyResults: Record<string, PropertyValidationResult> = {}

    mergeValidationResults(eventProperties, propertyResults)

    expect(eventProperties[0].failedEventIds).toBeUndefined()
    expect(eventProperties[0].passedEventIds).toBeUndefined()
  })
})

describe('validateEvent edge cases', () => {
  it('returns empty results for empty spec', () => {
    const emptySpec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: []
    }

    const result = validateEvent({ someProp: 'value' }, emptySpec)

    expect(result.propertyResults.someProp).toEqual({})
  })

  it('handles properties not in spec', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            knownProp: { type: 'string', required: true }
          }
        }
      ]
    }

    const result = validateEvent({ unknownProp: 'value' }, spec)

    expect(result.propertyResults.unknownProp).toEqual({})
  })

  it('handles multiple events with different constraints', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            sharedProp: {
              type: 'string',
              required: true,
              pinnedValues: { a: ['evt_1'] }
            }
          }
        },
        {
          branchId: 'main',
          baseEventId: 'evt_2',
          variantIds: [],
          props: {
            sharedProp: {
              type: 'string',
              required: true,
              pinnedValues: { b: ['evt_2'] }
            }
          }
        }
      ]
    }

    // Value 'a' passes evt_1 but fails evt_2
    const resultA = validateEvent({ sharedProp: 'a' }, spec)
    expect(resultA.propertyResults.sharedProp.failedEventIds).toContain('evt_2')

    // Value 'b' passes evt_2 but fails evt_1
    const resultB = validateEvent({ sharedProp: 'b' }, spec)
    expect(resultB.propertyResults.sharedProp.failedEventIds).toContain('evt_1')
  })

  it('handles variantIds in validation', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: ['variant_1', 'variant_2'],
          props: {
            prop: {
              type: 'string',
              required: true,
              pinnedValues: { correct: ['evt_1', 'variant_1', 'variant_2'] }
            }
          }
        }
      ]
    }

    const resultFail = validateEvent({ prop: 'wrong' }, spec)
    expect(resultFail.propertyResults.prop.failedEventIds).toContain('evt_1')
    expect(resultFail.propertyResults.prop.failedEventIds).toContain('variant_1')
    expect(resultFail.propertyResults.prop.failedEventIds).toContain('variant_2')
  })

  it('validates NaN fails all min/max constraints', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            numProp: {
              type: 'int',
              required: true,
              minMaxRanges: { '0,100': ['evt_1'] }
            }
          }
        }
      ]
    }

    const result = validateEvent({ numProp: NaN }, spec)
    expect(result.propertyResults.numProp.failedEventIds).toEqual(['evt_1'])
  })

  it('handles non-string values with regex patterns', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            regexProp: {
              type: 'string',
              required: true,
              regexPatterns: { '^test': ['evt_1'] }
            }
          }
        }
      ]
    }

    // Number value should fail regex validation
    const result = validateEvent({ regexProp: 123 }, spec)
    expect(result.propertyResults.regexProp.failedEventIds).toEqual(['evt_1'])
  })

  it('handles object values in pinned value comparison', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            objProp: {
              type: 'object',
              required: true,
              pinnedValues: { '{"key":"value"}': ['evt_1'] }
            }
          }
        }
      ]
    }

    // Matching object (JSON stringified comparison)
    const resultPass = validateEvent({ objProp: { key: 'value' } }, spec)
    expect(resultPass.propertyResults.objProp).toEqual({})

    // Non-matching object
    const resultFail = validateEvent({ objProp: { key: 'different' } }, spec)
    expect(resultFail.propertyResults.objProp.failedEventIds).toEqual(['evt_1'])
  })

  it('prefers passedEventIds when smaller than failedEventIds', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: ['v1', 'v2', 'v3'],
          props: {
            prop: {
              type: 'string',
              required: true,
              pinnedValues: { a: ['evt_1'], b: ['v1', 'v2', 'v3'] }
            }
          }
        }
      ]
    }

    // Value 'a' passes evt_1 but fails v1, v2, v3 (3 failed)
    // Should return passedEventIds since 1 < 3
    const result = validateEvent({ prop: 'a' }, spec)
    expect(result.propertyResults.prop.passedEventIds).toEqual(['evt_1'])
    expect(result.propertyResults.prop.failedEventIds).toBeUndefined()
  })

  it('handles boolean values in allowed values check', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            boolProp: {
              type: 'boolean',
              required: true,
              allowedValues: { '["true"]': ['evt_1'] }
            }
          }
        }
      ]
    }

    const resultPass = validateEvent({ boolProp: true }, spec)
    expect(resultPass.propertyResults.boolProp).toEqual({})

    const resultFail = validateEvent({ boolProp: false }, spec)
    expect(resultFail.propertyResults.boolProp.failedEventIds).toEqual(['evt_1'])
  })

  it('handles invalid regex patterns gracefully', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            regexProp: {
              type: 'string',
              required: true,
              regexPatterns: {
                '[invalid(regex': ['evt_1'], // Invalid regex - unclosed bracket
                '^valid$': ['evt_1'] // Valid regex
              }
            }
          }
        }
      ]
    }

    // Should not throw - invalid regex is skipped, valid regex is still checked
    const resultPass = validateEvent({ regexProp: 'valid' }, spec)
    expect(resultPass.propertyResults.regexProp).toEqual({})

    // Fails the valid regex
    const resultFail = validateEvent({ regexProp: 'invalid' }, spec)
    expect(resultFail.propertyResults.regexProp.failedEventIds).toEqual(['evt_1'])
  })

  it('handles malformed min/max range strings gracefully', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            numProp: {
              type: 'int',
              required: true,
              minMaxRanges: {
                'abc,def': ['evt_1'], // Malformed - non-numeric
                '0,100': ['evt_1'] // Valid range
              }
            }
          }
        }
      ]
    }

    // Should not throw - malformed range is skipped, valid range is still checked
    const resultPass = validateEvent({ numProp: 50 }, spec)
    expect(resultPass.propertyResults.numProp).toEqual({})

    // Fails the valid range
    const resultFail = validateEvent({ numProp: 150 }, spec)
    expect(resultFail.propertyResults.numProp.failedEventIds).toEqual(['evt_1'])
  })

  it('handles completely malformed range with no comma', () => {
    const spec: EventSpec = {
      metadata: { schemaId: 'schema_1', branchId: 'main', latestActionId: 'action_1' },
      events: [
        {
          branchId: 'main',
          baseEventId: 'evt_1',
          variantIds: [],
          props: {
            numProp: {
              type: 'int',
              required: true,
              minMaxRanges: {
                nocomma: ['evt_1'] // No comma at all
              }
            }
          }
        }
      ]
    }

    // Should not throw - malformed range is skipped
    const result = validateEvent({ numProp: 50 }, spec)
    // No valid constraints to fail, so passes
    expect(result.propertyResults.numProp).toEqual({})
  })
})
