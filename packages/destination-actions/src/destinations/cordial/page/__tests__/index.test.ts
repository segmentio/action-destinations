import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Cordial.page', () => {
  it('should work with default mappings', async () => {
    nock('https://integrations.cordial.io/segment').post('/page').reply(200, {});

    const event = createTestEvent({ type: 'page' });
    const settings = {
      apiKey: 'cordialApiKey',
      endpoint: 'https://integrations.cordial.io/segment' as const
    }

    const responses = await testDestination.testAction('page', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
