import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings = { apiKey: 'api-key', url: 'app.trubrics.com/api/ingestion' }
const mapping = { user_id: 'user-id', timestamp: '2021-01-01T00:00:00.000Z', anonymous_id: 'my-id', traits: {} }

describe('Trubrics.identify', () => {
  it('should work', async () => {
    nock(`https://${settings.url}`)
      .post('/identify_segment_users', [mapping])
      .matchHeader('x-api-key', settings.apiKey)
      .reply(200, {})

    const responses = await testDestination.testAction('identify', {
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
