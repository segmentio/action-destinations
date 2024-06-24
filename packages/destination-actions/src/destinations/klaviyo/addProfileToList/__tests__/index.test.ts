import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { Mock } from 'jest-mock'

import * as Functions from '../../functions'

jest.mock('../../functions', () => ({
  ...jest.requireActual('../../functions'),
  createImportJobPayload: jest.fn(),
  sendImportJobRequest: jest.fn(() => Promise.resolve())
}))

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

const importJobPayload = {
  data: {
    type: 'profile-bulk-import-job',
    attributes: {
      profiles: {
        data: [
          {
            type: 'profile',
            attributes: {
              email: 'valid@example.com',
              external_id: 'fake-external-id'
            }
          }
        ]
      }
    },
    relationships: {
      lists: {
        data: [{ type: 'list', id: listId }]
      }
    }
  }
}

const profileProperties = {
  first_name: 'John',
  last_name: 'Doe',
  image: 'http://example.com/image.jpg',
  title: 'Developer',
  organization: 'Segment',
  location: { city: 'San Francisco' },
  properties: { key: 'value' }
}

describe('Add List To Profile', () => {
  it('should throw error if no email or External Id is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(
      testDestination.testAction('addProfileToList', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(AggregateAjvError)
  })

  it('should add profile to list if successful with email only', async () => {
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
      list_id: listId,
      email: {
        '@path': '$.traits.email'
      }
    }
    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list if successful with external id only', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', { data: { type: 'profile', attributes: { external_id: 'testing_123' } } })
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
      properties: {
        external_id: 'testing_123'
      }
    })
    const mapping = {
      list_id: listId,
      external_id: 'testing_123'
    }

    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list if successful with both email and external id', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', {
        data: { type: 'profile', attributes: { email: 'demo@segment.com', external_id: 'testing_123' } }
      })
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
      properties: {
        external_id: 'testing_123'
      },
      traits: {
        email: 'demo@segment.com'
      }
    })
    const mapping = {
      list_id: listId,
      external_id: 'testing_123',
      email: {
        '@path': '$.traits.email'
      }
    }

    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list if successful with email, external id and profile properties', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', {
        data: {
          type: 'profile',
          attributes: { email: 'demo@segment.com', external_id: 'testing_123', ...profileProperties }
        }
      })
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
      properties: {
        external_id: 'testing_123'
      },
      context: {
        traits: {
          email: 'demo@segment.com',
          ...profileProperties
        }
      }
    })
    const mapping = {
      list_id: listId,
      email: 'demo@segment.com',
      external_id: 'testing_123',
      ...profileProperties
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
      list_id: listId,
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
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should filter out profiles without email or external_id', async () => {
    const events = [
      createTestEvent({
        context: { personas: { list_id: '123' }, traits: { email: 'valid@example.com' } }
      }),
      createTestEvent({
        context: { personas: {}, traits: {} }
      })
    ]

    const mapping = {
      list_id: listId,
      email: {
        '@path': '$.context.traits.email'
      }
    }

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true })

    await testDestination.testBatchAction('addProfileToList', {
      settings,
      events,
      mapping,
      useDefaultMappings: true
    })

    // Check if createImportJobPayload was called with only the valid profile
    expect(Functions.createImportJobPayload).toHaveBeenCalledWith(
      [
        {
          batch_size: 10000,
          list_id: listId,
          email: 'valid@example.com',
          enable_batching: true,
          location: {}
        }
      ],
      listId
    )
  })

  it('should create an import job payload with the correct listId', async () => {
    const events = [
      createTestEvent({
        context: { personas: { list_id: listId }, traits: { email: 'valid@example.com' } }
      })
    ]
    const mapping = {
      list_id: listId,
      external_id: 'fake-external-id',
      email: {
        '@path': '$.context.traits.email'
      }
    }

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true })

    await testDestination.testBatchAction('addProfileToList', {
      settings,
      events,
      mapping,
      useDefaultMappings: true
    })

    expect(Functions.createImportJobPayload).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'valid@example.com',
          external_id: 'fake-external-id',
          list_id: listId
        })
      ]),
      listId
    )
  })

  it('should send an import job request with the generated payload and profile properties', async () => {
    const events = [
      createTestEvent({
        context: { personas: { list_id: listId }, traits: { email: 'valid@example.com' } }
      })
    ]
    const mapping = {
      list_id: listId,
      external_id: 'fake-external-id',
      email: {
        '@path': '$.context.traits.email'
      },
      ...profileProperties
    }

    nock(API_URL).post('/profile-bulk-import-jobs/', importJobPayload).reply(200, { success: true })

    await testDestination.testBatchAction('addProfileToList', {
      events,
      settings,
      mapping,
      useDefaultMappings: true
    })
    expect(Functions.createImportJobPayload).toBeCalledWith(
      [
        {
          batch_size: 10000,
          email: 'valid@example.com',
          enable_batching: true,
          external_id: 'fake-external-id',
          list_id: listId,
          ...profileProperties
        }
      ],
      listId
    )
  })

  it('should send an import job request with the generated payload', async () => {
    const events = [
      createTestEvent({
        context: { personas: { list_id: listId }, traits: { email: 'valid@example.com' } }
      })
    ]
    const mapping = {
      list_id: listId,
      external_id: 'fake-external-id',
      email: {
        '@path': '$.context.traits.email'
      }
    }

    ;(Functions.createImportJobPayload as Mock).mockImplementation(() => importJobPayload)
    nock(API_URL).post('/profile-bulk-import-jobs/', importJobPayload).reply(200, { success: true })

    await testDestination.testBatchAction('addProfileToList', {
      events,
      settings,
      mapping,
      useDefaultMappings: true
    })

    expect(Functions.sendImportJobRequest).toHaveBeenCalledWith(expect.anything(), importJobPayload)
  })
})
