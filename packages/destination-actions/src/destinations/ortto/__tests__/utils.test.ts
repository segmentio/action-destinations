import { cleanObject } from '../utils'

describe('Ortto', () => {
  describe('utils', () => {
    it('cleanobject must remove empty keys with value', async () => {
      expect(cleanObject({ '': 'v', k: 'v' })).toStrictEqual({ k: 'v' })
    })
  })

  describe('utils', () => {
    it('cleanobject must remove empty keys with empty value', async () => {
      expect(cleanObject({ '': '', k: 'v' })).toStrictEqual({ k: 'v' })
    })
  })

  describe('utils', () => {
    it('cleanobject must remove multiple empty keys', async () => {
      expect(cleanObject({ '': '', '': 'v', k: 'v' })).toStrictEqual({ k: 'v' })
    })
  })

  describe('utils', () => {
    it('cleanobject should not remove empty values', async () => {
      expect(
        cleanObject({
          k1: '',
          k2: 'v2',
          k3: 0,
          k4: false,
          k5: [],
          k6: {},
          k7: null,
          k8: undefined
        })
      ).toStrictEqual({
        k1: '',
        k2: 'v2',
        k3: 0,
        k4: false,
        k5: [],
        k6: {},
        k7: null,
        k8: undefined
      })
    })
  })

  describe('utils', () => {
    it('cleanobject should not process arrays', async () => {
      expect(
        cleanObject({
          k1: ['', undefined, null, 'v', { x: 'y', '': '', k1: undefined, k2: null }],
          '': '',
          k2: {},
          k3: ['', undefined, null, 'v', { x: 'y', '': '' }],
          k4: {
            '': '',
            k: 100
          }
        })
      ).toStrictEqual({
        k1: ['', undefined, null, 'v', { x: 'y', '': '', k1: undefined, k2: null }],
        k2: {},
        k3: ['', undefined, null, 'v', { x: 'y', '': '' }],
        k4: {
          k: 100
        }
      })
    })
  })

  describe('utils', () => {
    it('cleanobject must clean nested objects', async () => {
      expect(
        cleanObject({
          '': 'v',
          k: 'v',
          l1: {
            '': '',
            k2: undefined,
            k3: null,
            k4: 'v4',
            l2: {
              '': '',
              k2: undefined,
              k5: 'v5',
              k3: null
            }
          }
        })
      ).toStrictEqual({
        k: 'v',
        l1: {
          k2: undefined,
          k3: null,
          k4: 'v4',
          l2: {
            k2: undefined,
            k5: 'v5',
            k3: null
          }
        }
      })
    })
  })
})
