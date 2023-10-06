import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { baseURL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Apolloio.track', () => {
  // TODO: Test your action
  it('should work', async () => {
    nock(baseURL).post('').reply(200, {})

    const responses = await testDestination.testAction('track', {
      mapping: { timestamp: '2111-12-22T04:37:50.244Z' },
      settings: { apiToken: 'api-key' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toContain('2111-12-22T04:37:50.244Z')
  })
})
