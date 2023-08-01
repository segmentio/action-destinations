import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Prodeology.identify', () => {
  it('should work', async () => {
    nock('https://api-dev.prodeology.com/api/v1').post('/event-collection/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      mapping: { anonymousId: 'my-id', traits: {}, timestamp: '2021-01-01T00:00:00.000Z', messageId: 'message-id' },
      settings: { apiKey: 'api-key' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toContain('my-id')
    expect(responses[0].options.body).toContain('traits')
  })
})
