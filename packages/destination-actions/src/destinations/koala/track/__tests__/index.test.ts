import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Koala.track', () => {
  it('forwards the segment event in the `events` field', async () => {
    nock(`https://api2.getkoala.com/web/projects/testId`).post('/batch').reply(204, {})

    const responses = await testDestination.testAction('track', {
      mapping: {
        device_ip: '192.168.0.1',
        email: 'netto@getkoala.com',
        traits: {
          vip: true,
          email: 'netto@getkoala.com'
        },
        event: 'test-track',
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        context: {},
        properties: {
          banana: 'phone'
        }
      },
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      ip: '192.168.0.1',
      email: 'netto@getkoala.com',
      traits: {
        vip: true,
        email: 'netto@getkoala.com'
      },
      events: [
        {
          type: 'track',
          event: 'test-track',
          sent_at: '2023-03-03T00:00:00.000Z',
          message_id: 'message_id',
          properties: { banana: 'phone' },
          context: {}
        }
      ]
    })
  })

  it('ignore events that are missing an identity', async () => {
    const responses = await testDestination.testAction('track', {
      mapping: {
        device_ip: '192.168.0.1',
        event: 'test-track',
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        context: {},
        properties: {
          banana: 'phone'
        }
      },
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(0)
  })

  it('ignores client side events by default', async () => {
    const responses = await testDestination.testAction('track', {
      mapping: {
        device_ip: '192.168.0.1',
        email: 'netto@getkoala.com',
        traits: {
          vip: true,
          email: 'netto@getkoala.com'
        },
        event: 'test-track',
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        // This will force the event to be ignored
        context: {
          library: {
            name: 'analytics.js'
          }
        },
        properties: {
          banana: 'phone'
        }
      },
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(0)
  })

  it('accepts server side events', async () => {
    nock(`https://api2.getkoala.com/web/projects/testId`).post('/batch').reply(204, {})

    const responses = await testDestination.testAction('track', {
      mapping: {
        device_ip: '192.168.0.1',
        email: 'netto@getkoala.com',
        traits: {
          vip: true,
          email: 'netto@getkoala.com'
        },
        event: 'test-track',
        sent_at: '2023-03-03T00:00:00.000Z',
        message_id: 'message_id',
        context: {
          library: {
            name: 'analytics-ruby'
          }
        },
        properties: {
          banana: 'phone'
        }
      },
      settings: { public_key: 'testId' }
    })

    expect(responses.length).toBe(1)
  })
})
