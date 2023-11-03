import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { BASE_URL } from '../index'

const testDestination = createTestIntegration(Definition)

describe('Iqm', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(`${BASE_URL}`).post('').reply(200, {})

      // This should match your authentication.fields
      const authData = { pixel_id: 'my-pixel-id' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
