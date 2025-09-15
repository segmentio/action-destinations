import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.page', () => {
  it('should track page events with default mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('page', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({ name: 'Home', userId: 'bobby' }),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"page"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('Home')
  })

  it('should track page events with custom mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('page', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({ name: 'Home', userId: 'bobby', properties: { title: 'Home | Accoil' } }),
      mapping: {
        userId: {
          '@path': '$.userId'
        },
        name: {
          '@path': '$.properties.title'
        },
        timestamp: {
          '@path': '$.timestamp'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"page"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('Home | Accoil')
  })
})
