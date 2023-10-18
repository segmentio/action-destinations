import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Apolloio.track', () => {
  it('should work', async () => {
    nock('https://apollo.io/').post(/.*/).reply(200, {})

    const responses = await testDestination.testAction('track', {
      mapping: {
        anonymousId: '#ZEj!sso)8ImNKQTntip',
        event: 'click',
        ipAddress: '127.0.0.1',
        timestamp: '2021-05-20T12:00:00.000Z',
        userId: 'SampleUser123',
        page: {}
      },
      settings: { apiToken: 'api-key' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toContain('anonymousId')
    expect(responses[0].options.body).toContain('2021-05-20T12:00:00.000Z')
    expect(responses[0].options.body).toContain('anonymousId')
    expect(responses[0].options.body).toContain('event')
    expect(responses[0].options.body).toContain('click')
  })
})
