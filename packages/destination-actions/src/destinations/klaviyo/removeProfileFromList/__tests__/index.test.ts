import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import * as Functions from '../../functions'

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
    },
    {
      type: 'profile',
      id: 'XYZABD'
    }
  ]
}

describe('Remove List from Profile', () => {
  it('should throw error if no external_id/email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfileFromList', { event, settings })).rejects.toThrowError(
      AggregateAjvError
    )
  })

  it('should throw an error for invalid phone number format', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          phone: 'invalid-phone-number'
        }
      },
      properties: {}
    })

    const mapping = {
      list_id: listId,
      phone_number: {
        '@path': '$.context.traits.phone'
      }
    }

    await expect(
      testDestination.testAction('removeProfileFromList', { event, mapping, settings })
    ).rejects.toThrowError('invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.')
  })

  it('should remove profile from list successfully with email address only', async () => {
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
      .get(`/?filter=any(email,["${email}"])`)
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

  it('should remove profile from list successfully with External Id only', async () => {
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
      .get(`/?filter=any(external_id,["${external_id}"])`)
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

  it('should remove profile from list successfully with Phone Number only', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const phone_number = '+15005435907'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(phone_number,["${phone_number}"])`)
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
        phone_number: '+15005435907'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: '+15005435907'
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

  it('should filter out profiles with invalid phone numbers', async () => {
    const getProfilesMock = jest
      .spyOn(Functions, 'getProfiles')
      .mockImplementation(jest.fn())
      .mockReturnValue(Promise.resolve(['XYZABC']))

    const events = [
      createTestEvent({
        properties: {
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        properties: {
          phone: 'invalid-phone-number'
        }
      })
    ]

    const mapping = {
      list_id: listId,
      email: {
        '@path': '$.properties.email'
      },
      phone_number: {
        '@path': '$.properties.phone'
      }
    }

    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()

    // Verify that the profile with invalid phone number was filtered out
    expect(getProfilesMock).toHaveBeenCalledWith(expect.anything(), ['user1@example.com'], [], [])
    getProfilesMock.mockRestore()
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

    nock(`${API_URL}`)
      .get('/profiles/')
      .query({
        filter: 'any(email,["user1@example.com","user2@example.com"])'
      })
      .reply(200, {
        data: [{ id: 'XYZABC' }, { id: 'XYZABD' }]
      })

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()
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

    nock(`${API_URL}`)
      .get('/profiles/')
      .query({
        filter: 'any(external_id,["externalId1","externalId2"])'
      })
      .reply(200, {
        data: [{ id: 'XYZABC' }, { id: 'XYZABD' }]
      })

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()
  })

  it('should remove multiple profiles with valid phone numbers', async () => {
    const events = [
      createTestEvent({
        properties: {
          phone: '+15005435907'
        }
      }),
      createTestEvent({
        properties: {
          phone: '+15005435908'
        }
      })
    ]
    const mapping = {
      list_id: listId,
      phone_number: {
        '@path': '$.properties.phone'
      }
    }

    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(phone_number,["+15005435907","+15005435908"])`)
      .reply(200, {
        data: [{ id: 'XYZABC' }, { id: 'XYZABD' }]
      })

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()
  })

  it('should remove profiles with valid emails, phone numbers and external IDs', async () => {
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
      }),
      createTestEvent({
        properties: {
          phone: '+15005435907'
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
      },
      phone_number: {
        '@path': '$.properties.phone'
      }
    }

    nock(`${API_URL}`)
      .get('/profiles/')
      .query({
        filter: 'any(email,["user1@example.com"])'
      })
      .reply(200, {
        data: [{ id: 'XYZABD' }]
      })

    nock(`${API_URL}`)
      .get('/profiles/')
      .query({
        filter: 'any(external_id,["externalId2"])'
      })
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    const phone_number = '+15005435907'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(phone_number,["${phone_number}"])`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()
  })

  it('should filter out profiles without email, phone number or external ID', async () => {
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

    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    nock(`${API_URL}`)
      .get('/profiles/')
      .query({
        filter: 'any(email,["valid@example.com"])'
      })
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200)

    await expect(
      testDestination.testBatchAction('removeProfileFromList', {
        settings,
        events,
        mapping
      })
    ).resolves.not.toThrowError()
  })

  it('should handle an empty payload', async () => {
    const getProfilesMock = jest.spyOn(Functions, 'getProfiles').mockImplementation(jest.fn())
    const removeProfileFromListMock = jest.spyOn(Functions, 'removeProfileFromList').mockImplementation()

    await testDestination.testBatchAction('removeProfileFromList', {
      settings,
      events: []
    })

    expect(Functions.getProfiles).not.toHaveBeenCalled()
    expect(Functions.removeProfileFromList).not.toHaveBeenCalled()

    getProfilesMock.mockRestore()
    removeProfileFromListMock.mockRestore()
  })
})
