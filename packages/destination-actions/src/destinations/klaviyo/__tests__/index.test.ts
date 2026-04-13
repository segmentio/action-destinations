import nock from 'nock'
import { APIError, IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { KLAVIYO_API_REVISION, KLAVIYO_CANARY_API_REVISION } from '../versioning-info'
import { FLAGON_NAME } from '../functions'

const testDestination = createTestIntegration(Definition)

const API_URL = 'https://a.klaviyo.com/api'
const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

const createAudienceInput = {
  settings: {
    api_key: ''
  },
  audienceName: '',
  audienceSettings: {
    listId: ''
  }
}

const getAudienceInput = {
  settings: {
    api_key: apiKey
  },
  externalId: 'XYZABC'
}

const audienceName = 'Klaviyo Audience Name'

describe('Klaviyo (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(`${API_URL}`).get('/accounts/').reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('onDelete', () => {
    it('should support user deletions', async () => {
      const userId = 'test-user-id'

      const requestBody = {
        data: {
          type: 'data-privacy-deletion-job',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                id: userId
              }
            }
          }
        }
      }

      nock(`${API_URL}`).post('/data-privacy-deletion-jobs/', requestBody).reply(200, {})

      expect(testDestination.onDelete).toBeDefined()

      const event = createTestEvent({
        type: 'track',
        userId
      })

      if (testDestination.onDelete) {
        await expect(testDestination.onDelete(event, settings)).resolves.not.toThrowError()
      }
    })
  })

  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no api key is set in settings', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('creates an audience', async () => {
      createAudienceInput.audienceName = audienceName
      createAudienceInput.settings.api_key = apiKey

      nock(`${API_URL}`)
        .post('/lists', { data: { type: 'list', attributes: { name: audienceName } } })
        .matchHeader('Authorization', `Klaviyo-API-Key ${apiKey}`)
        .reply(200, {
          success: true,
          data: {
            id: 'XYZABC'
          }
        })

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({
        externalId: 'XYZABC'
      })
    })

    it('Should return list_id if list_id is set in audienceSetting', async () => {
      createAudienceInput.audienceSettings.listId = 'XYZABC'
      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({ externalId: 'XYZABC' })
    })
  })

  describe('getAudience', () => {
    const listId = getAudienceInput.externalId
    it('should succeed when with valid list id', async () => {
      nock(`${API_URL}/lists`)
        .get(`/${listId}`)
        .reply(200, {
          success: true,
          data: {
            id: 'XYZABC'
          }
        })
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({
        externalId: 'XYZABC'
      })
    })

    it('should throw an ApiError when the response is not ok', async () => {
      const errorMessage = 'List not found'
      nock(`${API_URL}/lists`)
        .get(`/${listId}`)
        .reply(404, {
          success: false,
          errors: [
            {
              detail: errorMessage
            }
          ]
        })

      const audiencePromise = testDestination.getAudience(getAudienceInput)
      await expect(audiencePromise).rejects.toThrow(APIError)
      await expect(audiencePromise).rejects.toHaveProperty('message', errorMessage)
      await expect(audiencePromise).rejects.toHaveProperty('status', 404)
    })
  })

  describe('API Revision Feature Flag', () => {
    it('should use stable API revision by default', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(API_URL)
        .post('/profiles/')
        .matchHeader('revision', KLAVIYO_API_REVISION)
        .reply(200, { data: { id: 'profile-123' } })

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          email: { '@path': '$.traits.email' }
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('should use canary API revision when feature flag is enabled', async () => {
      const event = createTestEvent({
        type: 'track',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      nock(API_URL)
        .post('/profiles/')
        .matchHeader('revision', KLAVIYO_CANARY_API_REVISION)
        .reply(200, { data: { id: 'profile-123' } })

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          email: { '@path': '$.traits.email' }
        },
        features: { [FLAGON_NAME]: true }
      })

      expect(responses[0].status).toBe(200)
    })
  })
})
