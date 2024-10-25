import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.trackEvent', () => {
  describe('perform', () => {
    it('works with default mappings', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Test Event',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(200)
    })

    it('throws an error if `email` or `userId` are not defined', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: null
      })

      await expect(
        testDestination.testAction('trackEvent', {
          event,
          useDefaultMappings: true
        })
      ).rejects.toThrowError(PayloadValidationError)
    })

    it('converts a date into a standard Iterable format', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user1234',
        properties: {
          myDate: '2023-05-17T22:49:53.310Z'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          myDate: '2023-05-17 22:49:53 +00:00'
        }
      })
    })

    it('does not modify a yyyy-mm-dd date', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user1234',
        properties: {
          myDate: '2023-05-17'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          myDate: '2023-05-17'
        }
      })
    })

    it('does not alter a midnight UTC datetime', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user1234',
        properties: {
          myDate: '2023-05-17T00:00:00.000Z'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          myDate: '2023-05-17 00:00:00 +00:00'
        }
      })
    })

    it('does not convert a non date string into a standard Iterable date format', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user1234',
        properties: {
          badDate1: '1234',
          badDate2: '1234-12',
          badDate3: '1234-12-00',
          badDate4: '1234-12-99',
          myGoodDate: '2023-05-17T22:49:53.310Z'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          badDate1: '1234',
          badDate2: '1234-12',
          badDate3: '1234-12-00',
          badDate4: '1234-12-99',
          myGoodDate: '2023-05-17 22:49:53 +00:00'
        }
      })
    })

    it('should success with mapping of preset and Entity Added event(presets) ', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Entity Added',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        // Using the mapping of presets with event type 'track'
        mapping: {
          dataFields: {
            '@path': '$.properties'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should success with mapping of preset and Journey Step Entered event(presets)', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Journey Step Entered',
        properties: {
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
      })

      nock('https://api.iterable.com/api').post('/events/track').reply(200, {})

      const responses = await testDestination.testAction('trackEvent', {
        event,
        // Using the mapping of presets with event type 'track'
        mapping: {
          dataFields: {
            '@path': '$.properties'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
  describe('performBatch', () => {
    it('works with default mappings for a userId-based event', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Test Event',
          userId: 'abcd',
          properties: {
            eventSequence: 1
          }
        }),
        createTestEvent({
          type: 'track',
          event: 'Test Event 2',
          userId: 'efgh',
          properties: {
            eventSequence: 2
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/events/trackBulk').reply(200, {})

      const responses = await testDestination.testBatchAction('trackEvent', {
        events,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        events: [
          {
            userId: 'abcd',
            eventName: 'Test Event',
            dataFields: {
              eventSequence: 1
            }
          },
          {
            userId: 'efgh',
            eventName: 'Test Event 2',
            dataFields: {
              eventSequence: 2
            }
          }
        ]
      })
    })
    it('works with default mappings for an email-based event', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Test Event',
          properties: {
            email: 'test@iterable.com',
            eventSequence: 1
          }
        }),
        createTestEvent({
          type: 'track',
          event: 'Test Event 2',
          properties: {
            email: 'test@iterable.com',
            eventSequence: 2
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/events/trackBulk').reply(200, {})

      const responses = await testDestination.testBatchAction('trackEvent', {
        events,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        events: [
          {
            email: 'test@iterable.com',
            eventName: 'Test Event',
            dataFields: {
              eventSequence: 1
            }
          },
          {
            email: 'test@iterable.com',
            eventName: 'Test Event 2',
            dataFields: {
              eventSequence: 2
            }
          }
        ]
      })
    })
  })
})
