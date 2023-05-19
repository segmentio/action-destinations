import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const LOOPS_API_KEY = 'some random secret'

describe('Loops.createOrUpdateContact', () => {
  it('should validate action fields', async () => {
    try {
      await testDestination.testAction('createOrUpdateContact', {
        settings: { apiKey: LOOPS_API_KEY }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'userId'.")
      expect(err.message).toContain("missing the required field 'email'.")
    }
  })

  it('should work', async () => {
    const testPayloadIn = {
      createdAt: '2025-05-05T14:17:38.089Z',
      customAttributes: {
        favoriteColor: 'blue'
      },
      email: 'test@example.com',
      firstName: 'Ellen',
      lastName: 'Richards',
      source: 'Segment',
      subscribed: true,
      userGroup: 'Alum',
      userId: 'some-id-1'
    }
    const testPayloadOut = {
      createdAt: '2025-05-05T14:17:38.089Z',
      favoriteColor: 'blue',
      email: 'test@example.com',
      firstName: 'Ellen',
      lastName: 'Richards',
      source: 'Segment',
      subscribed: true,
      userGroup: 'Alum',
      userId: 'some-id-1'
    }
    nock('https://app.loops.so/api/v1').put('/contacts/update', testPayloadOut).reply(200, {
      success: true,
      id: 'someId'
    })

    const responses = await testDestination.testAction('createOrUpdateContact', {
      mapping: testPayloadIn,
      settings: { apiKey: LOOPS_API_KEY }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should work without optional fields', async () => {
    const testPayload = {
      email: 'test@example.com',
      userId: 'some-id-1'
    }
    nock('https://app.loops.so/api/v1').put('/contacts/update', testPayload).reply(200, {
      success: true,
      id: 'someId'
    })

    const responses = await testDestination.testAction('createOrUpdateContact', {
      mapping: testPayload,
      settings: { apiKey: LOOPS_API_KEY }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
