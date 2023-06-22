import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_URL } from '../../utils/constants'

const testDestination = createTestIntegration(Destination)
const date = new Date()
const timestamp = date.toISOString()
const CALLIPER_SEGMENT_KEY = 'test-key'
const CALLIPER_COMPANY_ID = 'test-company'

describe('Calliper.identifyUser', () => {
  it('should call user identification API', async () => {
    const event = createTestEvent({
      timestamp,
      traits: {
        abc: '123',
        created_at: '2022-10-12T00:00:00.000Z',
        email: 'joe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '12345678',
        name: 'John'
      }
    })

    nock(API_URL).post('/user/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      companyId: CALLIPER_COMPANY_ID,
      key: CALLIPER_SEGMENT_KEY,
      user: {
        user_id: 'user1234',
        anonymous_id: 'anonId1234',
        name: 'John',
        created_at: '2022-10-12T00:00:00.000Z',
        email: 'joe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '12345678',
        traits: {
          abc: '123'
        }
      }
    })
  })

  it('if name is empty firstName and lastName should be combined into the name', async () => {
    nock(API_URL).post('/user/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event: createTestEvent({
        timestamp,
        traits: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }),
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject(
      expect.objectContaining({
        user: expect.objectContaining({
          name: 'John Doe'
        })
      })
    )

    nock(API_URL).post('/user/identify').reply(200, {})
    const responseWithoutLastName = await testDestination.testAction('identifyUser', {
      event: createTestEvent({
        timestamp,
        traits: {
          firstName: 'John'
        }
      }),
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responseWithoutLastName.length).toBe(1)
    expect(responseWithoutLastName[0].status).toBe(200)
    expect(responseWithoutLastName[0].data).toMatchObject({})
    expect(responseWithoutLastName[0].options.json).toMatchObject(
      expect.objectContaining({
        user: expect.objectContaining({
          name: 'John'
        })
      })
    )

    nock(API_URL).post('/user/identify').reply(200, {})
    const responseWithoutFirstName = await testDestination.testAction('identifyUser', {
      event: createTestEvent({
        timestamp,
        traits: {
          lastName: 'Doe'
        }
      }),
      useDefaultMappings: true,
      settings: {
        segmentKey: CALLIPER_SEGMENT_KEY,
        companyId: CALLIPER_COMPANY_ID
      }
    })
    expect(responseWithoutFirstName.length).toBe(1)
    expect(responseWithoutFirstName[0].status).toBe(200)
    expect(responseWithoutFirstName[0].data).toMatchObject({})
    expect(responseWithoutFirstName[0].options.json).toMatchObject(
      expect.objectContaining({
        user: expect.objectContaining({
          name: 'Doe'
        })
      })
    )
  })
})
