import { flattenObject, transformEventName } from '../utils'

describe('HubSpot Cloud Mode (Actions) - Helper Functions', () => {
  describe('flattenObject', () => {
    it('should handle undefined and null objects', () => {
      expect(flattenObject(undefined)).toBeUndefined()
    })

    it('should handle undefined and null properties', () => {
      const obj = {
        a: undefined,
        b: null,
        c: 'string',
        d: 1,
        e: true
      }

      const flattened = flattenObject(obj)

      expect(flattened).toEqual({
        c: 'string',
        d: 1,
        e: true
      })
    })

    it('it should flatten arrays and objects correctly', () => {
      const obj = {
        arr: [1, 2, 3, { test: 'test' }, 4],
        obj: {
          a: 1,
          b: 'text',
          c: true
        }
      }

      const flattened = flattenObject(obj)

      expect(flattened).toEqual({
        arr: '1;2;3;{"test":"test"};4',
        obj: '{"a":1,"b":"text","c":true}'
      })
    })
  })

  describe('transformEventName', () => {
    it('it should tranform and event name into lowercase and replace with underscore', () => {
      const eventName = 'pe22596207 Test Event Http'

      const transformedEvent = transformEventName(eventName)

      expect(transformedEvent).toEqual('pe22596207_test_event_http')
    })
  })
})
