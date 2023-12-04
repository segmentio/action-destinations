import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createImportJobPayload } from '../../functions'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'XYZABC'

const requestBody = {
  data: [
    {
      type: 'profile',
      id: 'XYZABC'
    }
  ]
}

const profileData = {
  data: {
    type: 'profile',
    attributes: {
      email: 'demo@segment.com'
    }
  }
}

describe('Add List To Profile', () => {
  it('should throw error if no list_id/email is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('addProfileToList', { event, settings })).rejects.toThrowError(
      AggregateAjvError
    )
  })

  it('should add profile to list if successful', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', profileData)
      .reply(200, {
        data: {
          id: 'XYZABC'
        }
      })

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          content: requestBody
        })
      )

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'demo@segment.com'
      }
    })
    const mapping = {
      external_id: listId,
      email: {
        '@path': '$.traits.email'
      }
    }
    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add to list if profile is already created', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', profileData)
      .reply(409, {
        errors: [
          {
            meta: {
              duplicate_profile_id: 'XYZABC'
            }
          }
        ]
      })

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          content: requestBody
        })
      )

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'demo@segment.com'
      }
    })
    const mapping = {
      external_id: listId,
      email: {
        '@path': '$.traits.email'
      }
    }
    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})

describe('Add Profile To List Batch', () => {
  beforeEach(() => {
    // Reset mocks and clean up before each test
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should filter out profiles without email and external_id', async () => {
    const events = [
      createTestEvent({
        context: { personas: { external_id: '123' } },
        traits: { email: 'valid@example.com' }
      }),
      createTestEvent({
        context: { personas: {} },
        traits: {}
      }) // Invalid profile
    ]

    // Assuming testDestination.testBatchAction simulates the performBatch action call
    const response = await testDestination.testBatchAction('AddProfileToList', {
      settings,
      events,
      useDefaultMappings: true
    })

    // Only the valid profile should be processed
    expect(response).toHaveLength(1)
  })

  it('should create an import job payload with the correct listId', async () => {
    const events = [
      createTestEvent({
        context: { personas: { external_id: 'list123' } },
        traits: { email: 'valid@example.com' }
      })
    ]

    nock(API_URL).post('/import-job-endpoint').reply(200, { success: true })

    await testDestination.testBatchAction('AddProfileToList', {
      settings,
      events,
      useDefaultMappings: true
    })

    // Verify that the import job payload is created with the correct listId
    expect(createImportJobPayload).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          context: { personas: { external_id: 'list123' } },
          traits: { email: 'valid@example.com' }
        })
      ]),
      'list123'
    )
  })

  it('should send an import job request with the generated payload', async () => {
    const events = [
      createTestEvent({
        context: { personas: { external_id: 'list123' } },
        traits: { email: 'valid@example.com' }
      })
    ]
    const importJobPayload = { profiles: events, listId: 'list123' }

    jest.mock('../functions', () => ({
      ...jest.requireActual('../functions'),
      createImportJobPayload: jest.fn().mockReturnValue(importJobPayload)
    }))

    nock(API_URL).post('/import-job-endpoint', importJobPayload).reply(200, { success: true })

    const response = await testDestination.testBatchAction('AddProfileToList', {
      settings,
      events,
      useDefaultMappings: true
    })

    // Verify that the import job request is sent with the expected payload
    expect(sendImportJobRequest).toHaveBeenCalledWith(expect.anything(), importJobPayload)
    expect(response).toMatchObject({ success: true })
  })

  it('should handle errors during the import job request', async () => {
    const events = [
      createTestEvent({
        context: { personas: { external_id: 'list123' } },
        traits: { email: 'error@example.com' }
      })
    ]

    nock(API_URL).post('/import-job-endpoint').reply(500, { error: 'Server error' })

    await expect(
      testDestination.testBatchAction('AddProfileToList', {
        settings,
        events,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Server error')
  })
})
