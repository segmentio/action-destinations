import { createTestIntegration } from '@segment/actions-core'
import { ExecuteInput } from '@segment/actions-core'
import { Settings } from '../generated-types'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Google Sheets', () => {
  describe('extendRequest', () => {
    it('should populate headers with authentication', async () => {
      const accessToken = '12345abcde'
      const authData: Partial<ExecuteInput<Settings, undefined>> = {
        auth: {
          accessToken,
          refreshToken: ''
        }
      }

      const extendedRequest = testDestination.extendRequest?.(authData as ExecuteInput<Settings, undefined>)
      expect(extendedRequest?.headers?.['authorization']).toContain(`Bearer ${accessToken}`)
    })
  })
})
