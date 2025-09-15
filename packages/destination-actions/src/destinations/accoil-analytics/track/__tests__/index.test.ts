import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.track', () => {
  it('should track user events with default mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('track', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({ event: 'Purchase Complete', userId: 'bobby' }),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"track"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('Purchase Complete')
  })

  it('should track user events with custom mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('track', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({
        event: 'Purchase Complete',
        userId: 'bobby',
        properties: { event_detail: 'Purchased New Book' }
      }),
      mapping: {
        userId: {
          '@path': '$.userId'
        },
        event: {
          '@path': '$.properties.event_detail'
        },
        timestamp: {
          '@path': '$.timestamp'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"track"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('Purchased New Book')
  })
})
