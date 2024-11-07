import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const settings: Settings = {
  apiKey: 'key',
  endpoint: 'https://api.getdrip.com/v2',
  accountId: '2445926'
}

const testDestination = createTestIntegration(Destination)

describe('Drip.identify', () => {
  it('should identify with default mappings', async () => {
    nock('https://api.getdrip.com').post('/v2/2445926/subscribers').reply(200, {})

    const event = createTestEvent({
      context: {
        ip: '127.0.0.1',
        timezone: 'Europe/Amsterdam'
      },
      traits: {
        email: 'test@example.com',
        sms: '1234567890',
        status: 'unsubscribed',
        statusUpdatedAt: '2021-01-01T00:00:00Z'
      },
      properties: {
        customFields: { fizz: 'buzz' },
        tags: 'tag1,tag2'
      }
    })

    const responses = await testDestination.testAction('identify', {
      settings: settings,
      event: event,
      useDefaultMappings: true
    })

    const body = {
      custom_fields: { fizz: 'buzz' },
      email: 'test@example.com',
      ip_address: '127.0.0.1',
      sms_number: '1234567890',
      status: 'unsubscribed',
      status_updated_at: '2021-01-01T00:00:00Z',
      tags: ['tag1', 'tag2'],
      time_zone: 'Europe/Amsterdam'
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(JSON.parse(responses[0].options.body)).toEqual(body)
  })

  // TODO: should identify with mappings

  it('should batch identify with default mappings', async () => {
    nock('https://api.getdrip.com').post('/v2/2445926/subscribers/batches').reply(200, {})

    const event = createTestEvent({
      event: 'Custom',
      traits: { email: 'foo@bar.com' },
      properties: { fizz: 'buzz' }
    })

    const responses = await testDestination.testBatchAction('identify', {
      settings: settings,
      events: [event],
      useDefaultMappings: true
    })

    const body = {
      subscribers: [
        {
          email: 'foo@bar.com',
          ip_address: '8.8.8.8', // This could be wrong. Is this the IP address of the client, or segment?
          status: 'unsubscribed',
          time_zone: 'Europe/Amsterdam'
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })

  it('should batch identify with custom mappings', async () => {
    nock('https://api.getdrip.com').post('/v2/2445926/subscribers/batches').reply(200, {})

    const event = createTestEvent({
      context: {
        ip: '127.0.0.1',
        timezone: 'UTC'
      },
      traits: {
        properties: {
          email: 'test@example.com',
          status: 'active',
          statusUpdatedAt: '2023-01-01T00:00:00Z',
          customFields: {
            plan: 'premium',
            company: 'Acme Inc'
          },
          tags: 'vip,premium'
        }
      }
    })

    const responses = await testDestination.testBatchAction('identify', {
      settings: settings,
      events: [event],
      mapping: {
        email: {
          '@path': '$.traits.properties.email'
        },
        status: {
          '@path': '$.traits.properties.status'
        },
        statusUpdatedAt: {
          '@path': '$.traits.properties.statusUpdatedAt'
        },
        customFields: {
          '@path': '$.traits.properties.customFields'
        },
        tags: {
          '@path': '$.traits.properties.tags'
        },
        ip: {
          '@path': '$.context.ip'
        },
        timezone: {
          '@path': '$.context.timezone'
        }
      }
    })

    const body = {
      subscribers: [
        {
          custom_fields: {
            plan: 'premium',
            company: 'Acme Inc'
          },
          email: 'test@example.com',
          ip_address: '127.0.0.1',
          status: 'active',
          status_updated_at: '2023-01-01T00:00:00Z',
          tags: ['vip', 'premium'],
          time_zone: 'UTC'
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })
})
