import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const settings: Settings = {
  accountId: '2445926',
  apiKey: 'key'
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
        phone: '1234567890',
        initial_status: 'active',
        status: 'unsubscribed',
        status_updated_at: '2021-01-01T00:00:00Z',
        custom_fields: {
          fizz: 'buzz',
          numb: 1234,
          bool: true,
          oppBool: false,
          arr: ['hello', 1234, false],
          obj: { key: 'value' },
          null: null
        },
        tags: 'tag1,tag2'
      }
    })

    const responses = await testDestination.testAction('identify', {
      settings: settings,
      event: event,
      useDefaultMappings: true
    })

    const body = {
      subscribers: [
        {
          custom_fields: {
            fizz: 'buzz',
            numb: '1234',
            bool: 'true',
            oppBool: 'false',
            arr: '["hello",1234,false]',
            obj: '{"key":"value"}'
          },
          email: 'test@example.com',
          ip_address: '127.0.0.1',
          phone: '1234567890',
          initial_status: 'active',
          status: 'unsubscribed',
          status_updated_at: '2021-01-01T00:00:00Z',
          tags: ['tag1', 'tag2'],
          time_zone: 'Europe/Amsterdam'
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(JSON.parse(responses[0].options.body as string)).toEqual(body)
  })

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
      batches: [
        {
          subscribers: [
            {
              email: 'foo@bar.com',
              ip_address: '8.8.8.8',
              initial_status: 'unsubscribed',
              time_zone: 'Europe/Amsterdam'
            }
          ]
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
          initial_status: 'awaiting_confirmation',
          status: 'active',
          status_updated_at: '2023-01-01T00:00:00Z',
          custom_fields: {
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
        initial_status: {
          '@path': '$.traits.properties.initial_status'
        },
        status: {
          '@path': '$.traits.properties.status'
        },
        status_updated_at: {
          '@path': '$.traits.properties.status_updated_at'
        },
        custom_fields: {
          '@path': '$.traits.properties.custom_fields'
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
      batches: [
        {
          subscribers: [
            {
              custom_fields: {
                plan: 'premium',
                company: 'Acme Inc'
              },
              email: 'test@example.com',
              ip_address: '127.0.0.1',
              initial_status: 'awaiting_confirmation',
              status: 'active',
              status_updated_at: '2023-01-01T00:00:00Z',
              tags: ['vip', 'premium'],
              time_zone: 'UTC'
            }
          ]
        }
      ]
    }

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(JSON.stringify(body))
  })
})
