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

    it('should format date objects to permissible format', async () => {
      const d = new Date()
      const event = createTestEvent({
        type: 'identify',
        userId: 'user1234',
        receivedAt: d,
        traits: {
          phone: '+14158675309'
        }
      })

      nock('https://api.iterable.com/api').post('/users/update').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        mapping: {
          phoneNumber: {
            '@path': '$.traits.phone'
          },
          userId: {
            '@path': '$.userId'
          },
          dataFields: {
            receivedAtDateString: {
              '@path': '$.receivedAt'
            }
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        userId: 'user1234',
        dataFields: {
          phoneNumber: '+14158675309',
          receivedAtDateString: `${d.toISOString().replace('T', ' ').split('.')[0]} +00:00`
        }
      })
    })
  })

  describe('perform updateEmail', () => {
    it('calls updateEmail endpoint with currentEmail when only email is provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: undefined,
        traits: {
          email: 'old@example.com'
        }
      })

      nock('https://api.iterable.com/api').post('/users/updateEmail').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        useDefaultMappings: true,
        mapping: {
          newEmail: 'new@example.com'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual({
        currentEmail: 'old@example.com',
        newEmail: 'new@example.com'
      })
    })

    it('calls updateEmail endpoint when newEmail is provided with currentUserId', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'seg_user_01',
        traits: {
          firstName: 'Test'
        }
      })

      nock('https://api.iterable.com/api').post('/users/updateEmail').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        mapping: {
          userId: { '@path': '$.userId' },
          newEmail: 'updated@example.com'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual({
        currentUserId: 'seg_user_01',
        newEmail: 'updated@example.com'
      })
    })

    it('sends both currentEmail and currentUserId when both are available', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'seg_user_01',
        traits: {
          email: 'old@example.com'
        }
      })

      nock('https://api.iterable.com/api').post('/users/updateEmail').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        useDefaultMappings: true,
        mapping: {
          newEmail: 'new@example.com'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toEqual({
        currentEmail: 'old@example.com',
        currentUserId: 'seg_user_01',
        newEmail: 'new@example.com'
      })
    })

    it('uses EU endpoint for updateEmail when dataCenterLocation is europe', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'old@example.com'
        }
      })

      nock('https://api.eu.iterable.com/api').post('/users/updateEmail').reply(200, {})

      const responses = await testDestination.testAction('updateUser', {
        event,
        useDefaultMappings: true,
        settings: { apiKey: 'testApiKey', dataCenterLocation: 'europe' },
        mapping: {
          newEmail: 'new@example.com'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
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

    it('includes updateOnly in request when enabled', async () => {
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
        mapping: {
          updateOnly: true
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        updateOnly: true,
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

    it('does not include updateOnly in request when disabled', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user1234',
          traits: {
            phone: '+14158675309'
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/users/bulkUpdate').reply(200, {})

      const responses = await testDestination.testBatchAction('updateUser', {
        events,
        mapping: {
          updateOnly: false
        },
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
          }
        ]
      })
      expect(responses[0].options.json).not.toHaveProperty('updateOnly')
    })

    it('does not set newEmail in dataFields.email when newEmail is not provided', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'seg_user_01',
          traits: {
            name: 'User One'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'seg_user_02',
          traits: {
            name: 'User Two'
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/users/bulkUpdate').reply(200, {})

      const responses = await testDestination.testBatchAction('updateUser', {
        events,
        useDefaultMappings: true,
        settings: { apiKey: 'testApiKey', dataCenterLocation: 'united_states' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        users: [
          {
            userId: 'seg_user_01'
          },
          {
            userId: 'seg_user_02'
          }
        ]
      })
      expect(responses[0].options.json.users[0].dataFields).not.toHaveProperty('email')
      expect(responses[0].options.json.users[1].dataFields).not.toHaveProperty('email')
    })

    it('includes newEmail in dataFields.email when newEmail is provided in batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'seg_user_01',
          traits: {
            email: 'megaman7@gmail.com',
            newEmail: 'megaman8@gmail.com'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'gen_seg_01',
          traits: {
            email: 'goldenaxe7@gmail.com',
            newEmail: 'goldenaxe8@gmail.com'
          }
        })
      ]

      nock('https://api.iterable.com/api').post('/users/bulkUpdate').reply(200, {})

      const responses = await testDestination.testBatchAction('updateUser', {
        events,
        mapping: {
          email: { '@path': '$.traits.email' },
          userId: { '@path': '$.userId' },
          newEmail: { '@path': '$.traits.newEmail' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].options.json).toMatchObject({
        users: [
          {
            email: 'megaman7@gmail.com',
            userId: 'seg_user_01',
            dataFields: {
              email: 'megaman8@gmail.com'
            }
          },
          {
            email: 'goldenaxe7@gmail.com',
            userId: 'gen_seg_01',
            dataFields: {
              email: 'goldenaxe8@gmail.com'
            }
          }
        ]
      })
    })
  })
})
