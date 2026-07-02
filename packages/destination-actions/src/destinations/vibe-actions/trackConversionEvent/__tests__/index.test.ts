import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const ENDPOINT = 'https://t.vibe.co'
const PATH = '/s2s-conversion/events'

const settings = { pixelId: 'pixel-abc-123' }

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
      event: 'purchase',
      messageId: 'msg-1',
      timestamp: '2021-08-17T15:21:15.449Z',
      context: {
        ip: '8.8.8.8',
        userAgent: 'Mozilla/5.0',
        page: { url: 'https://example.com/checkout' }
      },
      properties: {
        price: 75.5,
        order_id: 'order-99',
        gid: 'GA1.2.3'
      }
    })

    const responses = await testDestination.testAction('trackConversionEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe(200)
    expect(requestBody).toMatchObject({
      eid: 'msg-1',
      a: 'purchase',
      aid: 'pixel-abc-123',
      ts: new Date('2021-08-17T15:21:15.449Z').getTime(),
      ip: '8.8.8.8',
      ua: 'Mozilla/5.0',
      url: 'https://example.com/checkout',
      gid: 'GA1.2.3',
      ed: JSON.stringify({ price_usd: 75.5, purchase_id: 'order-99' })
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
        timestamp: '2021-08-17T15:21:15.449Z'
      }
    })

    // UUID v4 format
    expect(requestBody.eid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(requestBody.a).toBe('signup')
    // No event data keys -> ed omitted
    expect(requestBody.ed).toBeUndefined()
  })

  it('omits ed when neither price nor purchaseId is present', async () => {
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
        timestamp: '2021-08-17T15:21:15.449Z',
        ipAddress: '1.1.1.1'
      }
    })

    expect(requestBody.ed).toBeUndefined()
    expect(requestBody.a).toBe('lead')
  })

  it('rejects an action value outside the allowed enum', async () => {
    await expect(
      testDestination.testAction('trackConversionEvent', {
        settings,
        mapping: {
          eventId: 'msg-3',
          action: 'not_a_real_action',
          timestamp: '2021-08-17T15:21:15.449Z'
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
          timestamp: 'not-a-date'
        }
      })
    ).rejects.toThrow()
  })
})
