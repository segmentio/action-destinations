import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import * as Functions from '../../functions'
import { Mock } from 'jest-mock'

jest.mock('../../functions', () => ({
  ...jest.requireActual('../../functions'),
  getProfiles: jest.fn(),
  removeProfileFromList: jest.fn(() => Promise.resolve({ success: true }))
}))

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'XYZABC'

describe('Remove List from Profile', () => {
  it('should throw error if no external_id/email is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfileFromList', { event, settings })).rejects.toThrowError(
      AggregateAjvError
    )
  })

  it('should remove profile from list if successful with email address only', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const email = 'test@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=equals(email,"${email}")`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(200, {
        data: [
          {
            id: 'XYZABC'
          }
        ]
      })

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      context: {
        personas: {
          external_audience_id: listId
        },
        traits: {
          email: 'test@example.com'
        }
      }
    })

    await expect(
      testDestination.testAction('removeProfileFromList', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should remove profile from list if successful with External Id only', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const external_id = 'testing_123'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=equals(external_id,"${external_id}")`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(200, {
        data: [
          {
            id: 'XYZABC'
          }
        ]
      })

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      context: {
        personas: {
          external_audience_id: listId
        }
      },
      properties: {
        external_id: 'testing_123'
      }
    })
    const mapping = {
      list_id: listId,
      external_id: 'testing_123'
    }

    await expect(
      testDestination.testAction('removeProfileFromList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})

describe('Remove List from Profile Batch', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should remove multiple profiles with valid emails', async () => {
    const events = [
      createTestEvent({
        properties: {
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        properties: {
          email: 'user2@example.com'
        }
      })
    ]
    const mapping = {
      list_id: listId,
      email: {
        '@path': '$.properties.email'
      }
    }

    ;(Functions.getProfiles as Mock).mockImplementation(() => Promise.resolve(['profileId1', 'profileId2']))

    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events,
      mapping
    })

    expect(Functions.getProfiles).toHaveBeenCalledWith(
      expect.anything(),
      ['user1@example.com', 'user2@example.com'],
      []
    )
    expect(Functions.removeProfileFromList).toHaveBeenCalledWith(
      expect.anything(),
      ['profileId1', 'profileId2'],
      listId
    )
  })

  it('should remove multiple profiles with valid external IDs', async () => {
    const events = [
      createTestEvent({
        properties: {
          external_id: 'externalId1'
        }
      }),
      createTestEvent({
        properties: {
          external_id: 'externalId2'
        }
      })
    ]

    const mapping = {
      list_id: listId,
      external_id: {
        '@path': '$.properties.external_id'
      }
    }

    ;(Functions.getProfiles as Mock).mockImplementation(() => Promise.resolve(['profileId1', 'profileId2']))

    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events,
      mapping
    })

    expect(Functions.getProfiles).toHaveBeenCalledWith(expect.anything(), [], ['externalId1', 'externalId2'])
    expect(Functions.removeProfileFromList).toHaveBeenCalledWith(
      expect.anything(),
      ['profileId1', 'profileId2'],
      listId
    )
  })

  it('should remove profiles with valid emails and external IDs', async () => {
    const events = [
      createTestEvent({
        properties: {
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        properties: {
          external_id: 'externalId2'
        }
      })
    ]

    const mapping = {
      list_id: listId,
      external_id: {
        '@path': '$.properties.external_id'
      },
      email: {
        '@path': '$.properties.email'
      }
    }

    ;(Functions.getProfiles as Mock).mockImplementation(() => Promise.resolve(['profileId1', 'profileId2']))

    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events,
      mapping
    })

    expect(Functions.getProfiles).toHaveBeenCalledWith(expect.anything(), ['user1@example.com'], ['externalId2'])
    expect(Functions.removeProfileFromList).toHaveBeenCalledWith(
      expect.anything(),
      ['profileId1', 'profileId2'],
      listId
    )
  })

  it('should filter out profiles without email or external ID', async () => {
    const events = [
      createTestEvent({
        properties: {
          fake: 'property'
        }
      }),
      createTestEvent({
        properties: {
          email: 'valid@example.com'
        }
      })
    ]

    const mapping = {
      list_id: listId,
      external_id: {
        '@path': '$.properties.external_id'
      },
      email: {
        '@path': '$.properties.email'
      }
    }

    ;(Functions.getProfiles as Mock).mockImplementation(() => Promise.resolve(['profileId2']))

    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events,
      mapping
    })

    expect(Functions.getProfiles).toHaveBeenCalledWith(expect.anything(), ['valid@example.com'], [])
    expect(Functions.removeProfileFromList).toHaveBeenCalledWith(expect.anything(), ['profileId2'], listId)
  })

  it('should handle an empty payload', async () => {
    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events: []
    })

    expect(Functions.getProfiles).not.toHaveBeenCalled()
    expect(Functions.removeProfileFromList).not.toHaveBeenCalled()
  })
})
