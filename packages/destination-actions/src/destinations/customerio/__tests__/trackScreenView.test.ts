import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { getDefaultMappings, testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('trackScreenView', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when a userId is supplied', async () => {
        const userId = 'abc123'
        const screen = 'Page One'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          screen,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          type: 'screen',
          name: screen,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackScreenView', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          name: screen,
          action: 'screen',
          type: 'person',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          timestamp: dayjs.utc(timestamp).unix(),
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId,
            person: {
              ...attributes.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          }
        })
      })

      it('should work with default mappings when a anonymousId is supplied', async () => {
        const anonymousId = 'anonymous123'
        const screen = 'Page One'
        const timestamp = dayjs.utc().toISOString()
        const attributes = {
          property1: 'this is a test',
          screen
        }
        const event = createTestEvent({
          type: 'screen',
          name: screen,
          anonymousId,
          properties: attributes,
          userId: undefined,
          timestamp
        })

        const response = await action('trackScreenView', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          name: screen,
          action: 'screen',
          type: 'person',
          attributes,
          identifiers: {
            anonymous_id: anonymousId
          },
          id: event.messageId,
          timestamp: dayjs.utc(timestamp).unix()
        })
      })

      it('should error when the name field is not supplied', async () => {
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          type: 'screen',
          anonymousId: undefined,
          userId: undefined,
          timestamp
        })

        try {
          await action('trackScreenView', { event, settings, useDefaultMappings: true })
          fail('This test should have thrown an error')
        } catch (e) {
          expect(e.message).toBe("The root value is missing the required field 'name'.")
        }
      })

      it('should work if `event_id` is unmapped', async () => {
        const userId = 'abc123'
        const screen = 'Page One'
        const timestamp = '2018-03-04T12:08:56.235 PDT'
        const attributes = {
          property1: 'this is a test',
          screen
        }
        const event = createTestEvent({
          type: 'screen',
          name: screen,
          userId,
          properties: attributes,
          timestamp
        })

        const mapping = getDefaultMappings('trackScreenView')

        // Ensure event_id is not mapped, such as for previous customers who have not updated their mappings.
        delete mapping.event_id

        const response = await action('trackScreenView', { event, mapping, settings })

        expect(response).toStrictEqual({
          name: screen,
          action: 'screen',
          type: 'person',
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          identifiers: {
            id: userId
          },
          timestamp
        })
      })

      it("should not convert timestamp if it's invalid", async () => {
        const userId = 'abc123'
        const screen = 'Page One'
        const timestamp = '2018-03-04T12:08:56.235 PDT'
        const attributes = {
          property1: 'this is a test',
          screen
        }
        const event = createTestEvent({
          type: 'screen',
          name: screen,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackScreenView', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          name: screen,
          action: 'screen',
          type: 'person',
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          id: event.messageId,
          identifiers: {
            id: userId
          },
          timestamp
        })
      })

      it('should not convert dates to unix timestamps when convert_timestamp is false', async () => {
        const userId = 'abc123'
        const screen = 'Page One'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          screen,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          type: 'screen',
          name: screen,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackScreenView', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: {
            convert_timestamp: false
          }
        })

        expect(response).toEqual({
          name: screen,
          action: 'screen',
          type: 'person',
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          id: event.messageId,
          identifiers: {
            id: userId
          },
          timestamp: dayjs.utc(timestamp).unix()
        })
      })
    })
  })
})
