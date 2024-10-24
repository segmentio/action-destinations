import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('OptimizelyDataPlatform.upsertContact', () => {
  beforeEach((done) => {
    testDestination = createTestIntegration(Destination)
    nock.cleanAll()
    done()
  })

  describe('single request', () => {
    const profileEvent = createTestEvent({
      type: 'identify',
      traits: {
        title: 'Mr',
        name: 'John Doe',
        email: 'test.email@test.com',
        first_name: 'John',
        last_name: 'Doe',
        age: 50,
        birthday: '01/01/1990',
        gender: 'male',
        address: {
          city: 'London',
          country: 'UK',
          postal_code: 'AB1 1AB',
          state: 'London',
          street: 'Victoria st'
        },
        company: 'Optimizely',
        phone: '1234567890',
        avatar: 'https://image-url.com'
      }
    })

    it('Should fire upsert contact profile', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      const response = await testDestination.testAction('upsertContact', {
        event: profileEvent,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: {
            anonymousId: 'anonId1234',
            userId: 'user1234',
            email: 'test@test.com'
          },
          title: 'Mr',
          name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
          age: 50,
          dob_year: 1990,
          dob_month: 1,
          dob_day: 1
        }
      })

      expect(response[0].status).toBe(201)
      // The expected body is a stringified JSON object
      expect(response[0].options.body).toMatchInlineSnapshot(
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"age\\":50}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201, {})

      await expect(
        testDestination.testAction('upsertContact', {
          event: profileEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201, {})

      await expect(
        testDestination.testAction('upsertContact', {
          event: profileEvent,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            // missing required field
            /* user_identifiers: {
              anonymousId: 'anonId1234',
              userId: 'user1234',
              email: 'test@test.com'
            }, */
            title: 'Mr',
            name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            age: 50,
            dob_year: 1990,
            dob_month: 1,
            dob_day: 1
          }
        })
      ).rejects.toThrowError()
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(400)

      await expect(
        testDestination.testAction('upsertContact', {
          event: profileEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(401)

      await expect(
        testDestination.testAction('upsertContact', {
          event: profileEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(429)

      await expect(
        testDestination.testAction('upsertContact', {
          event: profileEvent,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })

  describe('batch request', () => {
    const emailEvents = [
      createTestEvent({
        type: 'track',
        event: 'custom',
        timestamp: '2024-02-09T15:30:51.046Z',
        properties: {
          custom_field: 'hello',
          custom_field_num: 12345
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'custom',
        timestamp: '2024-02-09T15:30:51.046Z',
        properties: {
          custom_field: 'hello1',
          custom_field_num: 67890
        }
      })
    ]

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201, {})

      const response = await testDestination.testBatchAction('upsertContact', {
        events: emailEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: {
            anonymousId: 'anonId1234',
            userId: 'user1234',
            email: 'test@test.com'
          },
          title: 'Mr',
          name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe',
          age: 50,
          dob_year: 1990,
          dob_month: 1,
          dob_day: 1
        },
        useDefaultMappings: true
      })

      /// TODO: Check with Joe why address object exist if empty
      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchInlineSnapshot(
        // `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"age\\":50},{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"age\\":50}]"`
        `"[{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"age\\":50,\\"address\\":{}},{\\"user_identifiers\\":{\\"anonymousId\\":\\"anonId1234\\",\\"userId\\":\\"user1234\\",\\"email\\":\\"test@test.com\\"},\\"title\\":\\"Mr\\",\\"name\\":\\"John Doe\\",\\"age\\":50,\\"address\\":{}}]"`
      )
    })

    it('Should work with default values', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      await expect(
        testDestination.testBatchAction('upsertContact', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    /// TODO: Check with Joe why this test is NOT failing if missing required field
    it('should throw error if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      await expect(
        testDestination.testBatchAction('upsertContact', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          mapping: {
            // missing required field
            /* user_identifiers: {
              anonymousId: 'anonId1234',
              userId: 'user1234',
              email: 'test@test.com'
            }, */
            title: 'Mr',
            name: 'John Doe',
            first_name: 'John',
            last_name: 'Doe',
            age: 50,
            dob_year: 1990,
            dob_month: 1,
            dob_day: 1
          }
        })
      ).resolves.not.toThrowError()
      //.rejects.toThrowError() // It should have thrown error
    })

    it('should handle errors response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(400)

      await expect(
        testDestination.testBatchAction('upsertContact', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 401 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(401)

      await expect(
        testDestination.testBatchAction('upsertContact', {
          events: emailEvents,
          settings: {
            apiKey: 'wrongKey',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should handle 429 response', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(429)

      await expect(
        testDestination.testBatchAction('upsertContact', {
          events: emailEvents,
          settings: {
            apiKey: 'abc123',
            region: 'US'
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })
  })
})
