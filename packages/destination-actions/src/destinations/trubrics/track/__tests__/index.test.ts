import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings = { apiKey: 'api-key', url: 'app.trubrics.com/api/ingestion' }
const mapping = {
  anonymous_id: 'my-id',
  event: 'test event',
  timestamp: '2021-01-01T00:00:00.000Z',
  user_id: 'user-id'
}

describe('Trubrics.track', () => {
  it('should work', async () => {
    nock(`https://${settings.url}`)
      .post('/publish_segment_events', [mapping])
      .matchHeader('x-api-key', settings.apiKey)
      .reply(200, {})

    const responses = await testDestination.testAction('track', {
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
