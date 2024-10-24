import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

describe('Drip.track', () => {
  it('should track events with default mappings', async () => {
    nock('https://api-staging.getdrip.com').post('/v2/3977335/events').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { email: 'foo@bar.com' },
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testAction('track', {
      settings: { apiKey: 'key' },
      event: event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"track"/g)
    expect(responses[0].options.body).toContain('Custom')
    expect(responses[0].options.body).toContain('foo@bar.com')
    expect(responses[0].options.body).toContain('buzz')
    // TODO: not-match cases?
  })

  // it('should track events with custom mappings', async () => {
  //   nock('https://in.accoil.com').post('/segment').reply(200, {})

  //   const responses = await testDestination.testAction('track', {
  //     settings: { api_key: 'apikey' },
  //     event: createTestEvent({
  //       event: 'Purchase Complete',
  //       userId: 'bobby',
  //       properties: { event_detail: 'Purchased New Book' }
  //     }),
  //     mapping: {
  //       userId: {
  //         '@path': '$.userId'
  //       },
  //       event: {
  //         '@path': '$.properties.event_detail'
  //       },
  //       timestamp: {
  //         '@path': '$.timestamp'
  //       }
  //     }
  //   })

  //   expect(responses.length).toBe(1)
  //   expect(responses[0].status).toBe(200)
  //   expect(responses[0].options.body).toMatch(/"type":\s*"track"/g)
  //   expect(responses[0].options.body).toContain('bobby')
  //   expect(responses[0].options.body).toContain('Purchased New Book')
  // })
})
