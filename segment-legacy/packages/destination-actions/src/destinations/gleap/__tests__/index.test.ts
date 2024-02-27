import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const endpoint = 'https://api.gleap.io'

describe('Gleap (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoint).get('/admin/auth').reply(200, {})
      const authData = {
        apiToken: '1234'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(endpoint).get('/admin/auth').reply(404, {})
      const authData = {
        apiToken: '1234'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid: 404 Not Found')
      )
    })
  })

  describe('onDelete', () => {
    it('should delete a user with a given userId', async () => {
      const userId = '9999'
      const event = createTestEvent({ userId: '9999' })
      nock(endpoint).delete(`/admin/contacts/${userId}`).reply(200, {})

      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(event, {
          apiToken: '1234'
        })
        expect(response.status).toBe(200)
        expect(response.data).toMatchObject({})
      }
    })
  })
})
