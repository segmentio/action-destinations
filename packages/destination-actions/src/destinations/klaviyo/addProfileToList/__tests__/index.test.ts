import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
// import { Mock } from 'jest-mock'

// import * as Functions from '../../functions'

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

const profileProperties = {
  first_name: 'John',
  last_name: 'Doe',
  image: 'http://example.com/image.jpg',
  title: 'Developer',
  organization: 'Segment',
  location: { city: 'San Francisco' },
  properties: { key: 'value' }
}

describe('Add Profile To List', () => {
  it('should throw error if no email, phone number or External Id is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(
      testDestination.testAction('addProfileToList', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(AggregateAjvError)
  })

  it('should throw an error for invalid phone number format', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: '123',
      properties: {
        phone: 'invalid-phone-number'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: {
        '@path': '$.properties.phone'
      },
      country_code: 'US'
    }

    await expect(testDestination.testAction('addProfileToList', { event, mapping, settings })).rejects.toThrowError(
      'invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.'
    )
  })

  it('should convert a phone number to E.164 format if country code is provided', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', { data: { type: 'profile', attributes: { phone_number: '+918448309211' } } })
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
        phone: '8448309211'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: '8448309211',
      country_code: 'IN'
    }

    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list successfully with email only', async () => {
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

  it('should add profile to list successfully with external id only', async () => {
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

  it('should add profile to list successfully with phone number only', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', { data: { type: 'profile', attributes: { phone_number: '+15005435907' } } })
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
        phone: '+15005435907'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: '+15005435907'
    }

    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list successfully with both email and external id', async () => {
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

  it('should add profile to list successfully with email, phone number and external id', async () => {
    nock(`${API_URL}`)
      .post('/profiles/', {
        data: {
          type: 'profile',
          attributes: { email: 'demo@segment.com', external_id: 'testing_123', phone_number: '+15005435907' }
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
      traits: {
        email: 'demo@segment.com',
        phone: '+15005435907'
      }
    })
    const mapping = {
      list_id: listId,
      external_id: 'testing_123',
      email: {
        '@path': '$.traits.email'
      },
      phone_number: { '@path': '$.traits.phone' }
    }

    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should add profile to list successfully with email, external id and profile properties', async () => {
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
