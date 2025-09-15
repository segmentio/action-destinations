import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Prodeology.track', () => {
  it('should work', async () => {
    nock('https://api-dev.prodeology.com/api/v1').post('/event-collection/track').reply(200, {})

    const responses = await testDestination.testAction('track', {
      mapping: {
        anonymousId: 'anonymous-id',
        event: 'event-name',
        userId: 'user-id',
        timestamp: '2021-01-01T00:00:00.000Z',
        messageId: 'message-id'
      },
      settings: { apiKey: 'api-key' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toContain('anonymous-id')
    expect(responses[0].options.body).toContain('event-name')
    expect(responses[0].options.body).toContain('user-id')
  })
})
