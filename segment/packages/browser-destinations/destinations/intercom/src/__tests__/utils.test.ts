import dayjs from 'dayjs'
import { convertDateToUnix, filterCustomTraits, getWidgetOptions, isEmpty } from '../utils'

describe('Utils test', () => {
  describe('date handling tests', () => {
    test('handles ISO datestrings', () => {
      const date = new Date()
      const isoDate = date.toISOString()
      const unixDate = dayjs(isoDate).unix()

      expect(convertDateToUnix(isoDate)).toEqual(unixDate)
    })

    test('accepts Unix timestamps in seconds', () => {
      const date = Math.floor(new Date().getTime() / 1000)

      expect(convertDateToUnix(date)).toEqual(date)
    })

    test('accepts Unix timestamps in milliseconds', () => {
      const dateInMS = Math.floor(new Date().getTime())
      const dateInS = Math.floor(dateInMS / 1000)

      expect(convertDateToUnix(dateInMS)).toEqual(dateInS)
    })
  })

  describe('custom trait filtering tests', () => {
    test('objects & arrays will be filtered out of traits', () => {
      const traits = {
        name: 'ibum',
        badObj: {
          badKey: 'badValue'
        },
        badArray: ['i will be dropped']
      }

      expect(filterCustomTraits(traits)).toEqual({
        name: 'ibum'
      })
    })

    test('custom traits will be filtered with undefined traits object', () => {
      const traits = undefined
      expect(filterCustomTraits(traits)).toEqual({})
    })
  })

  describe('isEmpty tests', () => {
    test('isEmpty returns true if object is empty', () => {
      const obj = {}
      expect(isEmpty(obj)).toBe(true)
    })

    test('isEmpty returns false if object is not empty', () => {
      const obj = { prop: 'value' }
      expect(isEmpty(obj)).toBe(false)
    })

    test('isEmpty works for undefined obj', () => {
      const obj = undefined
      expect(isEmpty(obj)).toBe(true)
    })
  })

  describe('widget options tests', () => {
    test('attaches `activator` if activator is not default', () => {
      const activator = '#my-widget'
      const hide_default_launcher = undefined

      expect(getWidgetOptions(hide_default_launcher, activator)).toEqual({
        widget: {
          activator: activator
        }
      })
    })

    test('attaches `hide_default_launcher` if its not undefined ', () => {
      const activator = '#my-widget'
      const hide_default_launcher = false

      expect(getWidgetOptions(hide_default_launcher, activator)).toEqual({
        widget: {
          activator: activator
        },
        hide_default_launcher: false
      })
    })
  })
})
