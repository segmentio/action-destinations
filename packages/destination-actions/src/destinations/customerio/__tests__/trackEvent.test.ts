import { createTestEvent } from '@segment/actions-core'
import { Settings } from '../generated-types'
import dayjs from '../../../lib/dayjs'
import { getDefaultMappings, testRunner } from '../test-helper'

describe('CustomerIO', () => {
  describe('trackEvent', () => {
    testRunner((settings: Settings, action: Function) => {
      it('should work with default mappings when a userId is supplied', async () => {
        const userId = 'abc123'
        const name = 'testEvent'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          event: name,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackEvent', { event, settings, useDefaultMappings: true })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          name,
          timestamp: dayjs.utc(timestamp).unix(),
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId,
            person: {
              ...attributes.person,
              birthdate: dayjs.utc(birthdate).unix()
            }
          },
          type: 'person'
        })
      })

      it('should work with default mappings when a anonymousId is supplied', async () => {
        const anonymousId = 'anonymous123'
        const name = 'test event'
        const timestamp = dayjs.utc().toISOString()
        const attributes = {
          property1: 'this is a test'
        }
        const event = createTestEvent({
          event: name,
          anonymousId,
          properties: attributes,
          userId: undefined,
          timestamp
        })

        const response = await action('trackEvent', { event, settings, useDefaultMappings: true })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          name,
          attributes,
          identifiers: {
            anonymous_id: anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix(),
          type: 'person'
        })
      })

      it('should error when the name field is not supplied', async () => {
        const timestamp = dayjs.utc().toISOString()
        const attributes = {
          property1: 'this is a test'
        }
        const event = createTestEvent({
          event: undefined,
          properties: attributes,
          anonymousId: undefined,
          userId: undefined,
          timestamp
        })

        try {
          await action('trackEvent', { event, settings, useDefaultMappings: true })
          fail('This test should have thrown an error')
        } catch (e) {
          expect((e as Error).message).toBe("The root value is missing the required field 'name'.")
        }
      })

      it("should not convert timestamp if it's invalid", async () => {
        const userId = 'abc123'
        const name = 'testEvent'
        const timestamp = '2018-03-04T12:08:56.235 PDT'
        const attributes = {
          property1: 'this is a test'
        }
        const event = createTestEvent({
          event: name,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackEvent', {
          event,
          settings,
          useDefaultMappings: true
        })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          name,
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          timestamp,
          type: 'person'
        })
      })

      it('should not convert dates to unix timestamps when convert_timestamp is false', async () => {
        const userId = 'abc123'
        const name = 'testEvent'
        const timestamp = dayjs.utc().toISOString()
        const birthdate = dayjs.utc('1990-01-01T00:00:00Z').toISOString()
        const attributes = {
          property1: 'this is a test',
          person: {
            over18: true,
            identification: 'valid',
            birthdate
          }
        }
        const event = createTestEvent({
          event: name,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackEvent', {
          event,
          settings,
          useDefaultMappings: true,
          mapping: {
            convert_timestamp: false
          }
        })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          name,
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix(),
          type: 'person'
        })
      })

      it('should map messageId to id in the payload', async () => {
        const userId = 'abc123'
        const name = 'testEvent'
        const attributes = {
          property1: 'this is a test'
        }
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          event: name,
          userId,
          properties: attributes,
          timestamp
        })
        const response = await action('trackEvent', { event, settings, useDefaultMappings: true })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          name,
          attributes: {
            ...attributes,
            anonymous_id: event.anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix(),
          type: 'person'
        })
      })

      it('should succeed with mapping of preset and Journeys Step Transition event(presets)', async () => {
        const userId = 'abc123'
        const name = 'testEvent'
        const data = {
          journey_metadata: {
            journey_id: 'test-journey-id',
            journey_name: 'test-journey-name',
            step_id: 'test-step-id',
            step_name: 'test-step-name'
          },
          journey_context: {
            appointment_booked: {
              type: 'track',
              event: 'Appointment Booked',
              timestamp: '2021-09-01T00:00:00.000Z',
              properties: {
                appointment_id: 'test-appointment-id',
                appointment_date: '2021-09-01T00:00:00.000Z',
                appointment_type: 'test-appointment-type'
              }
            },
            appointment_confirmed: {
              type: 'track',
              event: 'Appointment Confirmed',
              timestamp: '2021-09-01T00:00:00.000Z',
              properties: {
                appointment_id: 'test-appointment-id',
                appointment_date: '2021-09-01T00:00:00.000Z',
                appointment_type: 'test-appointment-type'
              }
            }
          }
        }
        const timestamp = dayjs.utc().toISOString()
        const event = createTestEvent({
          event: name,
          userId,
          properties: data,
          timestamp
        })
        const mapping = {
          ...getDefaultMappings('trackEvent'),
          convert_timestamp: false,
          data: {
            '@path': '$.properties'
          }
        }
        const response = await action('trackEvent', { event, mapping, settings })

        expect(response).toEqual({
          action: 'event',
          id: event.messageId,
          identifiers: {
            id: userId
          },
          name,
          attributes: {
            ...data,
            anonymous_id: event.anonymousId
          },
          timestamp: dayjs.utc(timestamp).unix(),
          type: 'person'
        })
      })
    })
  })
})
