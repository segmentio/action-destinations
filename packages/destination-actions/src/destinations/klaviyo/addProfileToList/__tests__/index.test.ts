import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'

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
