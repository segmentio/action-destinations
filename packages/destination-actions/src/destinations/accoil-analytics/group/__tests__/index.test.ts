import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AccoilAnalytics.group', () => {
  it('should identify groups with default mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('group', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({
        userId: 'user1234',
        anonymousId: 'anon1234',
        groupId: 'group123',
        traits: { mrr: 10, plan: 'starter', status: 'trial', createdAt: '2018-01-01T00:00:00.000Z', name: 'Group X' }
      }),
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"group"/g)
    expect(responses[0].options.body).toMatch(/"userId":\s*"user1234"/g)
    expect(responses[0].options.body).toMatch(/"anonymousId":\s*"anon1234"/g)
    expect(responses[0].options.body).toContain('group123')
    expect(responses[0].options.body).toContain('Group X')
    expect(responses[0].options.body).toContain('starter')
    expect(responses[0].options.body).toContain('trial')
    expect(responses[0].options.body).toContain('2018-01-01')
    expect(responses[0].options.body).toMatch(/"mrr":\s*10/g)
  })

  it('should identify groups with custom mappings', async () => {
    nock('https://in.accoil.com').post('/segment').reply(200, {})

    const responses = await testDestination.testAction('group', {
      settings: { api_key: 'apikey' },
      event: createTestEvent({
        groupId: 'group123',
        traits: {
          monthly_revenue: 20.55,
          plan_type: 'starter',
          plan_status: 'trial',
          signup: '2018-01-01T00:00:00.000Z',
          account_name: 'Group X'
        }
      }),
      mapping: {
        groupId: {
          '@path': '$.groupId'
        },
        mrr: {
          '@path': '$.traits.monthly_revenue'
        },
        plan: {
          '@path': '$.traits.plan_type'
        },
        status: {
          '@path': '$.traits.plan_status'
        },
        createdAt: {
          '@path': '$.traits.signup'
        },
        name: {
          '@path': '$.traits.account_name'
        },
        timestamp: {
          '@path': '$.timestamp'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatch(/"type":\s*"group"/g)
    expect(responses[0].options.body).toContain('group123')
    expect(responses[0].options.body).toContain('Group X')
    expect(responses[0].options.body).toContain('starter')
    expect(responses[0].options.body).toContain('trial')
    expect(responses[0].options.body).toContain('2018-01-01')
    expect(responses[0].options.body).toMatch(/"mrr":\s*20\.55/g)
  })
})
