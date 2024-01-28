import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.postToAccoil', () => {
  // TODO: Test your action
  it('should validate api keys', async () => {
    try {
      await testDestination.testAuthentication({ api_key: 'secret' })
    } catch (err: any) {
      expect(err.message).toContain('API Key should be 32 characters')
    }
  })

  it('should ensure that authentication works', async () => {
    nock('https://in.accoil.com').get('/').reply(200, {})
  })
})
