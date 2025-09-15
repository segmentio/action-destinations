import nock from 'nock'
import { createTestEvent, createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const endpoint = 'https://api.hilohq.com'

describe('Hilo', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoint).get('/oauth/token/info?integration_id=integration-id').reply(200, {})

      const settings = { integrationId: 'integration-id' }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(endpoint).get('/oauth/token/info?integration_id=integration-id').reply(403, {})

      const settings = { integrationId: 'integration-id' }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(
        new Error('Credentials are invalid: 403 Forbidden')
      )
    })
  })

  describe('onDelete', () => {
    it('should delete a user', async () => {
      const event = createTestEvent({ userId: '9999' })
      nock(endpoint).post('/v1/events/delete?integration_id=integration-id').reply(200, {})

      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(event, { integrationId: 'integration-id' })
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })
  })
})
