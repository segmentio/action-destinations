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
      mapping: { anonymousId: 'my-id', event: 'event-name' },
      settings: { apiKey: 'api-key', endpoint: 'https://api.getripe.com/core-backend' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toContain('my-id')
    expect(responses[0].options.body).toContain('event-name')
  })
})
