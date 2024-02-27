import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Braze Cohorts', () => {
  describe('testAuthentication', () => {
    it('should throw an error in case of invalid client secret key', async () => {
      nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(401, {})

      const authData = {
        settings: {
          endpoint: 'https://rest.iad-01.braze.com',
          client_secret: 'Invalid_client_secret_key'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).rejects.toThrowError()
    })

    it('should not throw an error when settings is appropriate and api gives sucess', async () => {
      nock('https://rest.iad-01.braze.com').post('/partners/segment/cohorts/users').reply(201, {})

      const authData = {
        settings: {
          endpoint: 'https://rest.iad-01.braze.com',
          client_secret: 'valid_client_secret_key'
        }
      }

      await expect(testDestination.testAuthentication(authData.settings)).resolves.not.toThrowError()
    })
  })
})
