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
    ).rejects.toThrowError('Internal Server Error')
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

    expect(Functions.addProfileToList).toHaveBeenCalledWith(expect.anything(), profileId, listId)
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

describe('Upsert Profile Batch', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should discard profiles without email, phone_number, or external_id', async () => {
    const events = [createTestEvent({ traits: { first_name: 'John', last_name: 'Doe' } })]

    const response = await testDestination.testBatchAction('upsertProfile', {
      settings,
      events,
      useDefaultMappings: true
    })

    expect(response).toEqual([])
  })

  it('should process profiles with and without list_ids separately', async () => {
    const eventWithListId = createTestEvent({
      traits: { first_name: 'John', last_name: 'Doe', email: 'withlist@example.com', list_id: 'abc123' }
    })
    const eventWithoutListId = createTestEvent({
      traits: { first_name: 'Jane', last_name: 'Smith', email: 'withoutlist@example.com' }
    })

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true, withList: true })
    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true, withoutList: true })

    const responseWithList = await testDestination.testBatchAction('upsertProfile', {
      settings,
      events: [eventWithListId],
      mapping: { list_id: 'abc123' },
      useDefaultMappings: true
    })

    const responseWithoutList = await testDestination.testBatchAction('upsertProfile', {
      settings,
      events: [eventWithoutListId],
      mapping: {},
      useDefaultMappings: true
    })

    expect(responseWithList[0]).toMatchObject({
      data: { success: true, withList: true }
    })

    expect(responseWithoutList[0]).toMatchObject({
      data: { success: true, withoutList: true }
    })
  })

  it('should process profiles with list_ids only', async () => {
    const events = [createTestEvent({ traits: { email: 'withlist@example.com', list_id: 'abc123' } })]

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true, withList: true })

    const response = await testDestination.testBatchAction('upsertProfile', {
      settings,
      events,
      mapping: { list_id: 'abc123' },
      useDefaultMappings: true
    })

    expect(response[0].data).toMatchObject({
      success: true,
      withList: true
    })
    expect(response).toHaveLength(1)
  })

  it('should process profiles without list_ids only', async () => {
    const events = [createTestEvent({ traits: { email: 'withoutlist@example.com' } })]

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(200, { success: true, withoutList: true })

    const response = await testDestination.testBatchAction('upsertProfile', {
      settings,
      events,
      mapping: {},
      useDefaultMappings: true
    })

    expect(response[0].data).toMatchObject({
      success: true,
      withoutList: true
    })
    expect(response).toHaveLength(1)
  })

  it('should handle errors when sending profiles to Klaviyo', async () => {
    const events = [createTestEvent({ traits: { email: 'error@example.com' } })]

    nock(API_URL).post('/profile-bulk-import-jobs/').reply(500, { error: 'Server error' })

    await expect(
      testDestination.testBatchAction('upsertProfile', {
        settings,
        events,
        useDefaultMappings: true
      })
    ).rejects.toThrow()
  })
})
