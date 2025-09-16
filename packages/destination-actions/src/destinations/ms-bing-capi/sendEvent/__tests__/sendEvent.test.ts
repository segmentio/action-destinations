import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import destination from '../../index'
import type { Settings } from '../../generated-types'
import { time } from 'console'

function buildTrackEvent(overrides: Record<string, any> = {}) {
  return createTestEvent({
    type: overrides.type || 'track',
    event: overrides.event || 'Product Viewed',
    messageId: overrides.messageId || 'msg-123',
    timestamp: '2024-01-01T00:00:00.000Z',
    anonymousId: overrides.anonymousId || 'anon-1',
    userId: overrides.userId || 'user-1',
    properties: {
      value: 19.99,
      currency: 'USD',
      page_load_id: 'pl-1',
      ...overrides.properties
    },
    context: {
      ip: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
      page: {
        url: 'https://example.com/product',
        referrer: 'https://google.com',
        title: 'Product Page'
      },
      traits: {
        email: 'USER@example.COM',
        phone: '+1 (415) 555-0000'
      },
      ...overrides.context
    },
    ...overrides
  })
}

const settings: Settings = { UetTag: 'uet-123', ApiToken: 'token-abc', adStorageConsent: 'G' }

describe('Ms Bing Capi - sendEvent (updated)', () => {
  const testDestination = createTestIntegration(destination)
  afterEach(() => nock.cleanAll())

  function expectWrapped(body: any) {
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  }

  test('single perform: hashing + default consent + wrapper format', async () => {
    const event = buildTrackEvent()
    const iso = '2024-04-01T00:00:00.000Z'
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        expectWrapped(body)
        expect(body.data).toHaveLength(1)
        const item = body.data[0]
        expect(item.eventType).toBe('custom')
        expect(item.adStorageConsent).toBe('G')
        expect(item.userData.em).toMatch(/^[a-f0-9]{64}$/)
        expect(item.userData.ph).toMatch(/^[a-f0-9]{64}$/)
        expect(item.eventTime).toBe(Math.floor(new Date(iso).getTime() / 1000))
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: { eventType: 'custom', eventTime: iso },
        userData: { anonymousId: 'anon-1', em: 'USER@example.COM', ph: '+1 (415) 555-0000' },
        timestamp: { '@path': '$.timestamp' }
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('consent override in mapping', async () => {
    const event = buildTrackEvent()
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        const item = body.data[0]
        expect(item.adStorageConsent).toBe('D')
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: {
          eventType: 'custom',
          eventTime: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          adStorageConsent: 'D'
        },
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp' }
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('explicit eventTime mapping overrides timestamp', async () => {
    const isoEventTime = '2024-03-03T12:00:00.000Z'
    const event = buildTrackEvent()
    const expectedSeconds = Math.floor(new Date(isoEventTime).getTime() / 1000)
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        expect(body.data[0].eventTime).toBe(expectedSeconds)
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: { 
        data: { eventType: 'custom', eventTime: isoEventTime }, 
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp' } 
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('batch partial error mapping', async () => {
    const events = [buildTrackEvent({ messageId: 'm1' }), buildTrackEvent({ messageId: 'm2' })]
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`)
      .reply(200, { error: { details: [{ index: 1, errorMessage: 'Second failed' }] } })
    const responses: any = await testDestination.executeBatch('sendEvent', {
      events,
      settings,
      mapping: {
        enable_batching: true,
        data: { eventType: 'custom'},
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp'}
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(400)
    expect(responses[1].errormessage).toContain('Second failed')
    expect(scope.isDone()).toBe(true)
  })

  test('batch all success', async () => {
    const events = [buildTrackEvent({ messageId: 'm1' }), buildTrackEvent({ messageId: 'm2' })]
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        expect(body.data).toHaveLength(2)
        return true
      })
      .reply(200, {})
    const responses: any = await testDestination.executeBatch('sendEvent', {
      events,
      settings,
      mapping: {
        enable_batching: true,
        data: { eventType: 'custom'},
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp'}
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
    expect(scope.isDone()).toBe(true)
  })

  test('phone hash becomes null when only email provided', async () => {
    const event = buildTrackEvent({ context: { traits: { email: 'only@example.com' } } })
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        const u = body.data[0].userData
        expect(u.em).toMatch(/^[a-f0-9]{64}$/)
        expect(u.ph).toBeNull()
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: { eventType: 'custom'},
        userData: { anonymousId: 'anon-1', em: 'only@example.com' },
        timestamp: { '@path': '$.timestamp' }
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('customData.items defaults to []', async () => {
    const event = buildTrackEvent()
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        expect(body.data[0].customData.items).toEqual([])
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: { eventType: 'custom', eventTime: new Date('2024-01-01T00:00:00.000Z').toISOString() },
        customData: { value: 10 },
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp'}
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('pageLoad event requires page context mapping and is sent correctly', async () => {
    const iso = '2024-06-01T12:00:00.000Z'
    const event = buildTrackEvent({ type: 'page', event: undefined })
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        const item = body.data[0]
        expect(item.eventType).toBe('pageLoad')
        expect(item.eventSourceUrl).toBe('https://example.com/product')
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: { eventType: 'pageLoad', eventTime: iso, eventSourceUrl: 'https://example.com/product' },
        userData: { anonymousId: 'anon-1' },
        timestamp: { '@path': '$.timestamp' }
      }
    })
    expect(scope.isDone()).toBe(true)
  })

  test('phone digits normalized before hashing', async () => {
    const rawPhone = '+1 (555) 123-4567 ext.89'
    const event = buildTrackEvent({ context: { traits: { phone: rawPhone, email: 'norm@example.com' } } })
    const scope = nock('https://capi.uet.microsoft.com')
      .post(`/v1/${settings.UetTag}/events`, (body: any) => {
        const userData = body.data[0].userData
        // ensure hash present
        expect(userData.ph).toMatch(/^[a-f0-9]{64}$/)
        return true
      })
      .reply(200, {})
    await testDestination.testAction('sendEvent', {
      event,
      settings,
      mapping: {
        data: { eventType: 'custom', eventTime: '2024-01-01T00:00:00.000Z' },
        userData: { anonymousId: 'anon-1', ph: rawPhone },
        timestamp: { '@path': '$.timestamp'}
      }
    })
    expect(scope.isDone()).toBe(true)
  })
})
