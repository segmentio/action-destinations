import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const ENDPOINT = 'https://t.vibe.co'
const PATH = '/s2s-conversion/events/segment'

const settings = { pixelId: 'pixel-abc-123' }

// Use a recent timestamp so the 7-day freshness check passes.
const recentIso = new Date(Date.now() - 60 * 1000).toISOString()

describe('VibeActions.trackConversionEvent', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('sends a purchase conversion with default mappings', async () => {
    let requestBody: Record<string, unknown> = {}
    nock(ENDPOINT)
      .post(PATH, (body) => {
        requestBody = body
        return true
      })
      .reply(200, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      messageId: 'msg-1',
      timestamp: recentIso,
      context: {
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        page: { url: 'https://example.com/checkout' }
      },
      properties: {
        email: 'joe@gmail.com',
        price: 75.5,
        order_id: 'order-99',
        gid: 'GA1.2.3'
      }
    })

    const responses = await testDestination.testAction('trackConversionEvent', {
      event,
      settings,
      mapping: {
        action: 'purchase'
      },
      useDefaultMappings: true
    })

    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe(200)
    expect(requestBody).toMatchObject({
      eid: 'msg-1',
      a: 'purchase',
      aid: 'pixel-abc-123',
      ts: new Date(recentIso).getTime(),
      em: 'joe@gmail.com',
      ip: '8.8.8.8',
      ua: 'Mozilla/5.0',
      url: 'https://example.com/checkout',
      gid: 'GA1.2.3'
    })
    // ed merges arbitrary properties with the reserved keys.
    expect(JSON.parse(requestBody.ed as string)).toMatchObject({
      email: 'joe@gmail.com',
      price: 75.5,
      order_id: 'order-99',
      gid: 'GA1.2.3',
      price_usd: 75.5,
      purchase_id: 'order-99'
    })
  })

  it('generates a UUID for eid when messageId is absent', async () => {
    let requestBody: Record<string, unknown> = {}
    nock(ENDPOINT)
      .post(PATH, (body) => {
        requestBody = body
        return true
      })
      .reply(200, {})

    await testDestination.testAction('trackConversionEvent', {
      settings,
      mapping: {
        action: 'signup',
        timestamp: recentIso,
        email: 'jane@gmail.com'
      }
    })

    // UUID v4 format
    expect(requestBody.eid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(requestBody.a).toBe('signup')
    expect(requestBody.em).toBe('jane@gmail.com')
    // No event data -> ed omitted
    expect(requestBody.ed).toBeUndefined()
  })

  it('omits ed when no event data is present', async () => {
    let requestBody: Record<string, unknown> = {}
    nock(ENDPOINT)
      .post(PATH, (body) => {
        requestBody = body
        return true
      })
      .reply(200, {})

    await testDestination.testAction('trackConversionEvent', {
      settings,
      mapping: {
        eventId: 'msg-2',
        action: 'lead',
        timestamp: recentIso,
        ipAddress: '1.1.1.1'
      }
    })

    expect(requestBody.ed).toBeUndefined()
    expect(requestBody.a).toBe('lead')
    expect(requestBody.ip).toBe('1.1.1.1')
  })

  it('accepts the "call" action value', async () => {
    nock(ENDPOINT).post(PATH).reply(200, {})

    const responses = await testDestination.testAction('trackConversionEvent', {
      settings,
      mapping: {
        action: 'call',
        timestamp: recentIso,
        email: 'joe@gmail.com'
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('rejects an action value outside the allowed enum', async () => {
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          eventId: 'msg-3',
          action: 'not_a_real_action',
          timestamp: recentIso,
          email: 'joe@gmail.com'
        }
      })
    ).rejects.toThrow()
  })

  it('rejects an unparseable timestamp', async () => {
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          eventId: 'msg-4',
          action: 'install',
          timestamp: 'not-a-date',
          email: 'joe@gmail.com'
        }
      })
    ).rejects.toThrow()
  })

  it('rejects when neither email nor IP address is provided', async () => {
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          action: 'purchase',
          timestamp: recentIso
        }
      })
    ).rejects.toThrow('Either Email or IP Address is required.')
  })

  it('rejects a non-IPv4 IP address', async () => {
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          action: 'purchase',
          timestamp: recentIso,
          ipAddress: '2001:db8::1'
        }
      })
    ).rejects.toThrow('is not a valid IPv4 address')
  })

  it('rejects a timestamp older than 7 days', async () => {
    const staleIso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          action: 'purchase',
          timestamp: staleIso,
          email: 'joe@gmail.com'
        }
      })
    ).rejects.toThrow('older than 7 days')
  })
})
