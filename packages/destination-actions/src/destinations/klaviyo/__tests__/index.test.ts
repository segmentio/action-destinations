import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const API_URL = 'https://a.klaviyo.com/api'
const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

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
})
