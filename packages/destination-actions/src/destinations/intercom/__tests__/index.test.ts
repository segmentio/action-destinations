import nock from 'nock'
import { createTestEvent, createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const endpoint = 'https://api.intercom.io'

describe('Intercom (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(endpoint).get('/admins').reply(200, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail on authentication failure', async () => {
      nock(endpoint).get('/admins').reply(404, {})
      const authData = {}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError(
        new Error('Credentials are invalid:  Test authentication failed')
      )
    })
  })

  describe('onDelete', () => {
    it('should delete a user', async () => {
      const userId = '9999'
      const event = createTestEvent({ userId: '9999' })
      nock(endpoint).delete(`/contacts/${userId}`).reply(200, {})

      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(event, {})
        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })
  })
})
