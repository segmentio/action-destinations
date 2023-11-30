import nock from 'nock'
import { ExecuteInput, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)

describe('Attio', () => {
  describe(testDestination.testAuthentication, () => {
    it('should not throw if API responds with HTTP 200', async () => {
      nock('https://api.attio.com').get('/v1/token').reply(200, {})

      await expect(testDestination.testAuthentication({})).resolves.not.toThrowError()
    })

    it('should throw if API responds with HTTP 401', async () => {
      nock('https://api.attio.com').get('/v1/token').reply(401, {})

      await expect(testDestination.testAuthentication({})).rejects.toThrowError()
    })
  })

  describe('extendRequest', () => {
    it('should populate headers with authentication', async () => {
      const accessToken = '12345abcde'
      const authData: Partial<ExecuteInput<Settings, undefined>> = {
        auth: {
          accessToken,
          refreshToken: 'unused'
        }
      }

      const extendedRequest = testDestination.extendRequest?.(authData as ExecuteInput<Settings, undefined>)
      expect(extendedRequest?.headers?.['authorization']).toContain(`Bearer ${accessToken}`)
    })
  })
})
