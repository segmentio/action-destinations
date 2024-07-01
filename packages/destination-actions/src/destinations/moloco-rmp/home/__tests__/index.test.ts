import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoMCM.home', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent()
    const responses = await testDestination.testAction('home', {
      event,
      settings: {
        platformId: 'foo',
        platformName: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE'
      },
      mapping: {
        timestamp: { '@path': '$.timestamp' }
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  // There is no `HOME` specific required fields
})
