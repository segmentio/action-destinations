import nock from 'nock'
import { createTestIntegration, InvalidAuthenticationError } from '@segment/actions-core'
import Definition from '../index'
import { API_VERSION } from '../ortto-client'
import { TEST_API_KEY } from '../types'

const testDestination = createTestIntegration(Definition)
describe('Ortto', () => {
  describe('authentication', () => {
    it('should reject empty api keys', async () => {
      try {
        await testDestination.testAuthentication({ api_key: '' })
      } catch (err) {
        expect(err instanceof InvalidAuthenticationError)
      }
    })

    it('should reject whitespace api keys', async () => {
      try {
        await testDestination.testAuthentication({ api_key: '    ' })
      } catch (err) {
        expect(err instanceof InvalidAuthenticationError)
      }
    })

    it('should reject invalid api keys', async () => {
      try {
        await testDestination.testAuthentication({ api_key: 'invalid' })
      } catch (err) {
        expect(err instanceof InvalidAuthenticationError)
      }
    })

    it('should accept valid api keys', async () => {
      nock('https://segment-action-api-au.ortto.app')
        .get(`/${API_VERSION}/me`)
        .matchHeader('authorization', `Bearer ${TEST_API_KEY}`)
        .reply(200, {})
      await expect(testDestination.testAuthentication({ api_key: TEST_API_KEY })).resolves.not.toThrowError()
    })
  })
})
