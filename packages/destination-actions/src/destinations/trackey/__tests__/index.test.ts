import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)
const base = 'https://app.trackey.io'
const url = '/public-api/integrations/segment/webhook'

describe('Trackey', () => {
  it('should validate api key', async () => {
    nock(base).get(url).reply(200, {
      status: 'success',
      data: 'Test client'
    })

    const authData = {
      apiKey: 'test-api-key'
    }

    await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
  })
})
