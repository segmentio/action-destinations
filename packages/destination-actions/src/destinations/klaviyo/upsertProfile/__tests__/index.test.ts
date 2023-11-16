import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import * as Functions from '../../functions'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

jest.mock('../../functions', () => ({
  ...jest.requireActual('../../functions'),
  addProfileToList: jest.fn(() => Promise.resolve())
}))

describe('Upsert Profile', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should throw error if no email, phone_number, or external_id is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('upsertProfile', { event, settings })).rejects.toThrowError(
      IntegrationError
    )
  })

  it('should create a new profile if successful', async () => {
    const requestBody = {
      data: {
        type: 'profile',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }

    nock(`${API_URL}`).post('/profiles/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    })

    await expect(
      testDestination.testAction('upsertProfile', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should update an existing profile if duplicate is found', async () => {
    const requestBody = {
      data: {
        type: 'profile',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }

    const errorResponse = JSON.stringify({
      errors: [
        {
          meta: {
            duplicate_profile_id: '123'
          }
        }
      ]
    })

    nock(`${API_URL}`).post('/profiles/', requestBody).reply(409, errorResponse)

    const updateRequestBody = {
      data: {
        type: 'profile',
        id: '123',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }
    nock(`${API_URL}`).patch('/profiles/123', updateRequestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      traits: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    })

    await expect(
      testDestination.testAction('upsertProfile', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the API request fails', async () => {
    const requestBody = {
      data: {
        type: 'profile',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }

    nock(`${API_URL}`).post('/profiles/', requestBody).reply(500, {})

    const event = createTestEvent({
      type: 'track',
      traits: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    })

    await expect(
      testDestination.testAction('upsertProfile', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError('An error occurred while processing the request')
  })

  it('should add a profile to a list if list_id is provided', async () => {
    const listId = 'abc123'
    const profileId = '123'
    const mapping = { list_id: 'abc123' }

    const requestBody = {
      data: {
        type: 'profile',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }

    nock(`${API_URL}`)
      .post('/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          data: {
            id: profileId
          }
        })
      )

    nock(`${API_URL}`).post(`/lists/${listId}/relationships/profiles/`).reply(200)

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        list_id: listId
      }
    })

    await expect(
      testDestination.testAction('upsertProfile', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()

    expect(Functions.addProfileToList).toHaveBeenCalledWith(expect.anything(), 'POST', profileId, listId)
  })

  it('should add an existing profile to a list if list_id is provided', async () => {
    const listId = 'abc123'
    const profileId = '123'
    const mapping = { list_id: 'abc123' }

    const requestBody = {
      data: {
        type: 'profile',
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }

    const errorResponse = JSON.stringify({
      errors: [
        {
          meta: {
            duplicate_profile_id: profileId
          }
        }
      ]
    })

    nock(`${API_URL}`).post('/profiles/', requestBody).reply(409, errorResponse)

    const updateRequestBody = {
      data: {
        type: 'profile',
        id: profileId,
        attributes: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          location: {},
          properties: {}
        }
      }
    }
    nock(`${API_URL}`).patch(`/profiles/${profileId}`, updateRequestBody).reply(200, {})

    nock(`${API_URL}`).post(`/lists/${listId}/relationships/profiles/`).reply(200)

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        list_id: listId
      }
    })

    await expect(
      testDestination.testAction('upsertProfile', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()

    expect(Functions.addProfileToList).toHaveBeenCalledWith(expect.anything(), profileId, listId)
  })
})
