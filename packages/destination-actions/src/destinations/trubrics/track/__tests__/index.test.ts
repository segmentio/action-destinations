import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Trubrics.track', () => {
  it.skip('should work', async () => {
    const settings = { apiKey: 'api-key', url: 'api.trubrics.com' }
    const event = createTestEvent({ timestamp: '2021-08-17T15:21:15.449Z', event: 'Test Event' })
    nock(`https://${settings.url}`).post(`/publish_event?project_api_key=${settings.apiKey}`).reply(200, {})

    const responses = await testDestination.testAction('track', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })
})
