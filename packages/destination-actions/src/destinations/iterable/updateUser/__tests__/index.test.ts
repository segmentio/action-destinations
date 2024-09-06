import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Iterable.updateUser', () => {
  describe('perform', () => {
    it('works with default mappings', async () => {
      const event = createTestEvent({ type: 'identify' })

      nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('throws an error if `email` or `userId` are not defined', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          firstName: 'Johnny',
          lastName: 'Depp'
        }
      })

      await expect(
        testDestination.testAction('updateUser', {
          event
        })
      ).rejects.toThrowError(PayloadValidationError)
    })

    it('maps phoneNumber in dataFields', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user1234',
        traits: {
          phone: '+14158675309'
        }
      })

      nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          phoneNumber: '+14158675309'
        }
      })
    })

    it('should success with mapping of preset and `identify` call', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          phone: '+14158675309'
        }
      })

      nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        // Using the mapping of presets with event type 'track'
        mapping: {
          dataFields: {
            '@path': '$.traits'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should allow passing null values for phoneNumber', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user1234',
        traits: {
          phone: null,
          trait1: null
        }
      })

      nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        mapping: {
          dataFields: {
            '@path': '$.traits'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          phoneNumber: null,
          trait1: null
        }
      })
    })
  })
  describe('performBatch', () => {
    it('works with default mappings', async () => {
      const events = [createTestEvent({ type: 'identify' }), createTestEvent({ type: 'identify' })]

      nock('https://api.iterable.com/api').post('/users/bulkUpdate').reply(200, {})

      const responses = await testDestination.testBatchAction('updateUser', {
        events,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
    it('maps phoneNumber in dataFields', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1234',
          traits: {
            phone: '+14158675309'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user5678',
          traits: {
            phone: '+24158675309'
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/users/bulkUpdate').reply(200, {})

      const responses = await testDestination.testBatchAction('updateUser', {
        events,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        users: [
          {
            userId: 'user1234',
            dataFields: {
              phoneNumber: '+14158675309'
            }
          },
          {
            userId: 'user5678',
            dataFields: {
              phoneNumber: '+24158675309'
            }
          }
        ]
      })
    })
  })
})
