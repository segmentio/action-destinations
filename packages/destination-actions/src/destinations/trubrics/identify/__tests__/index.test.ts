import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings = { apiKey: 'api-key', url: 'app.trubrics.com/api/ingestion' }

describe('Trubrics.identify', () => {
  it('should work', async () => {
    nock(settings.url).post('/identify_segment_users').matchHeader('x-api-key', settings.apiKey).reply(200, {})

    const responses = await testDestination.testAction('identify', {
      mapping: { anonymousId: 'my-id', traits: {}, timestamp: '2021-01-01T00:00:00.000Z', user_id: 'user-id' },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
