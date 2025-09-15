import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.identify', () => {
  it('should identify users with default mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({ userId: 'bobby', traits: { role: 'admin', createdAt: '2018-01-01T00:00:00.000Z' } }),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"identify"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('timestamp')
    expect(responses[0].options.body).toContain('role')
    expect(responses[0].options.body).toContain('admin')
    expect(responses[0].options.body).toContain('createdAt')
    expect(responses[0].options.body).toContain('2018-01-01T00:00:00.000Z')
  })

  it('should identify users with custom mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({
        userId: 'bobby',
        traits: { level: 'member', user_created: '2019-01-01T00:00:00.000Z' }
      }),
      mapping: {
        userId: {
          '@path': '$.userId'
        },
        createdAt: {
          '@path': '$.traits.user_created'
        },
        role: {
          '@path': '$.traits.level'
        },
        timestamp: {
          '@path': '$.timestamp'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"identify"/g)
    expect(responses[0].options.body).toContain('bobby')
    expect(responses[0].options.body).toContain('timestamp')
    expect(responses[0].options.body).toContain('role')
    expect(responses[0].options.body).toContain('member')
    expect(responses[0].options.body).toContain('createdAt')
    expect(responses[0].options.body).toContain('2019-01-01T00:00:00.000Z')
  })
})
