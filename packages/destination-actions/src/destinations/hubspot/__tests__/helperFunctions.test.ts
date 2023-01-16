import { flattenObject } from '../helperFunctions'

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
        arr: '1;2;3;Object({"test":"test"});4',
        obj: 'Object({"a":1,"b":"text","c":true})'
      })
    })

    it('should handle cyclic objects', () => {
      const obj: any = {
        a: 1,
        b: 2,
        c: ['a', 'b', 'c']
      }

      // Add a cyclic reference in array
      obj.c.push(obj)
      obj.c.push('d')

      // Add an object with cyclic reference
      obj['d'] = obj

      const flattened = flattenObject(obj)

      expect(flattened).toEqual({
        a: 1,
        b: 2,
        c: 'a;b;c;[non-serializable];d',
        d: '[non-serializable]'
      })
    })
  })
})
