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

  describe('perform', () => {
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

    const requestData = {
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
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      const response = await testDestination.testAction('upsertContact', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should fail if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      const badData = {
        event: profileEvent,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: null
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testAction('upsertContact', badData)).rejects.toThrowError(
        "The root value is missing the required field 'user_identifiers'."
      )
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(400)

      await expect(testDestination.testAction('upsertContact', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(401)

      await expect(testDestination.testAction('upsertContact', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(429)

      await expect(testDestination.testAction('upsertContact', requestData)).rejects.toThrowError()
    })
  })

  describe('performBatch', () => {
    const profileEvents = [
      createTestEvent({
        type: 'identify',
        traits: {
          title: 'Mrs',
          name: 'sarah Doe',
          email: 'test.email1@test.com',
          first_name: 'Sarah',
          last_name: 'Doe',
          age: 50,
          birthday: '01/01/1980',
          gender: 'female',
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
      }),
      createTestEvent({
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
    ]

    const requestData = {
      eventsEndpoint: profileEvents,
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
    }

    it('Should fire custom event', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      const response = await testDestination.testBatchAction('upsertContact', requestData)

      expect(response[0].status).toBe(201)
      expect(response[0].options.body).toMatchSnapshot()
    })

    it('Should return empty array if missing required field', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(201)

      const badData = {
        eventsEndpoint: profileEvents,
        settings: {
          apiKey: 'abc123',
          region: 'US'
        },
        mapping: {
          user_identifiers: null
        },
        useDefaultMappings: true
      }

      await expect(testDestination.testBatchAction('upsertContact', badData)).resolves.toEqual([])
    })

    it('Should handle 400 error (bad body)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(400)

      await expect(testDestination.testBatchAction('upsertContact', requestData)).rejects.toThrowError()
    })

    it('Should handle 401 error (no auth)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(401)

      await expect(testDestination.testBatchAction('upsertContact', requestData)).rejects.toThrowError()
    })

    it('Should handle 429 error (rate limit)', async () => {
      nock('https://function.zaius.app/twilio_segment').post('/batch_upsert_contact').reply(429)

      await expect(testDestination.testBatchAction('upsertContact', requestData)).rejects.toThrowError()
    })
  })
})
