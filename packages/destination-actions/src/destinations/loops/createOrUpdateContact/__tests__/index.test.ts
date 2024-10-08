import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)
beforeEach(() => {
  nock.cleanAll()
  testDestination = createTestIntegration(Destination)
})

const LOOPS_API_KEY = 'some random secret'

describe('Loops.createOrUpdateContact', () => {
  it('should validate action fields', async () => {
    try {
      await testDestination.testAction('createOrUpdateContact', {
        settings: { apiKey: LOOPS_API_KEY }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'userId'.")
    }
  })

  it('should work', async () => {
    /* Event data going into Segment */
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
    /* Processed data coming out of Segment to the API */
    const testPayloadOut = {
      createdAt: '2025-05-05T14:17:38.089Z',
      favoriteColor: 'blue',
      email: 'test@example.com',
      firstName: 'Ellen',
      lastName: 'Richards',
      source: 'Segment',
      subscribed: true,
      userGroup: 'Alum',
      userId: 'some-id-1',
      mailingLists: {}
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
    expect(responses[0].data).toStrictEqual({
      success: true,
      id: 'someId'
    })
  })

  it('should not work without email', async () => {
    const testPayloadIn = {
      firstName: 'Ellen',
      userId: 'some-id-1'
    }
    const testPayloadOut = {
      firstName: 'Ellen',
      userId: 'some-id-1',
      mailingLists: {}
    }
    nock('https://app.loops.so/api/v1').put('/contacts/update', testPayloadOut).reply(400, {
      success: false,
      message: 'userId not found and cannot create a new contact without an email.'
    })
    await expect(
      testDestination.testAction('createOrUpdateContact', {
        mapping: testPayloadIn,
        settings: { apiKey: LOOPS_API_KEY }
      })
    ).rejects.toThrow('Bad Request')
  })

  it('should work without optional fields', async () => {
    const testPayloadIn = {
      email: 'test@example.com',
      userId: 'some-id-2'
    }
    const testPayloadOut = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {}
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
    expect(responses[0].data).toStrictEqual({
      success: true,
      id: 'someId'
    })
  })

  it('should filter out invalid mailingLists', async () => {
    const testPayloadIn = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {
        '1234': 'true',
        '74648': 'false',
        '56456': 'foobar'
      }
    }
    const testPayloadOut = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {
        1234: true,
        74648: false
      }
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
    expect(responses[0].data).toStrictEqual({
      success: true,
      id: 'someId'
    })
  })

  it('should work with empty mailingLists object', async () => {
    const testPayloadIn = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {}
    }
    const testPayloadOut = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {}
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
    expect(responses[0].data).toStrictEqual({
      success: true,
      id: 'someId'
    })
  })

  it('should work with no mailingLists object', async () => {
    const testPayloadIn = {
      email: 'test@example.com',
      userId: 'some-id-2'
    }
    const testPayloadOut = {
      email: 'test@example.com',
      userId: 'some-id-2',
      mailingLists: {}
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
    expect(responses[0].data).toStrictEqual({
      success: true,
      id: 'someId'
    })
  })
})
