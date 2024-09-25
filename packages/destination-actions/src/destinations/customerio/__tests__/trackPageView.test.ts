import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { getDefaultMappings, testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('trackPageView', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when a userId is supplied', async () => {
        const userId = 'abc123'
        const url = 'https://example.com/page-one'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          url,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackPageView', { event, settings, useDefaultMappings: true })

        expect(response).toEqual({
          action: 'page',
          name: url,
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
        const url = 'https://example.com/page-one'
        const timestamp = dayjs.utc().toISOString()
        const attributes = {
          property1: 'this is a test',
          url
        }
        const event = createTestEvent({
          anonymousId,
          properties: attributes,
          userId: undefined,
          timestamp
        })

        const response = await action('trackPageView', { event, settings, useDefaultMappings: true })

        expect(response).toEqual({
          action: 'page',
          name: url,
          type: 'person',
          attributes,
          id: event.messageId,
          identifiers: {
            anonymous_id: anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix()
        })
      })

      it('should work if `event_id` is unmapped', async () => {
        const anonymousId = 'anonymous123'
        const url = 'https://example.com/page-one'
        const timestamp = dayjs.utc().toISOString()
        const attributes = {
          property1: 'this is a test',
          url
        }
        const event = createTestEvent({
          anonymousId,
          properties: attributes,
          userId: undefined,
          timestamp
        })

        const mapping = getDefaultMappings('trackPageView')

        // Ensure event_id is not mapped, such as for previous customers who have not updated their mappings.
        delete mapping.event_id

        const response = await action('trackPageView', { event, mapping, settings })

        expect(response).toStrictEqual({
          action: 'page',
          name: url,
          type: 'person',
          attributes,
          identifiers: {
            anonymous_id: anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix()
        })
      })

      it('should error when the url field is not supplied', async () => {
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          anonymousId: undefined,
          userId: undefined,
          timestamp
        })

        try {
          await action('trackPageView', { event, settings, useDefaultMappings: true })
          fail('This test should have thrown an error')
        } catch (e) {
          expect(e.message).toBe("The root value is missing the required field 'url'.")
        }
      })

      it("should not convert timestamp if it's invalid", async () => {
        const userId = 'abc123'
        const url = 'https://example.com/page-one'
        const timestamp = '2018-03-04T12:08:56.235 PDT'
        const attributes = {
          property1: 'this is a test',
          url
        }
        const event = createTestEvent({
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackPageView', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'page',
          name: url,
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
        const url = 'https://example.com/page-one'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          url,
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackPageView', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: {
            convert_timestamp: false
          }
        })

        expect(response).toEqual({
          action: 'page',
          name: url,
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
