import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_BASE } from '../../api'

const testDestination = createTestIntegration(Definition)
const settings = { apiKey: 'gt_live_testkey' }

afterEach(() => {
  nock.cleanAll()
})

describe('GainTrace.pageView', () => {
  it('sends a page as a navigation-category event', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    await testDestination.testAction('pageView', {
      settings,
      mapping: { messageId: 'm-1', eventName: 'Pricing', timestamp: '2026-03-14T09:12:00.000Z', userId: 'u' }
    })

    expect(body.events[0]).toMatchObject({ event_name: 'Pricing', event_category: 'navigation' })
  })

  it('falls back to a stable name when the page call carries none', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }] } })

    await testDestination.testAction('pageView', {
      settings,
      mapping: { messageId: 'm-1', timestamp: '2026-03-14T09:12:00.000Z', userId: 'u' }
    })

    expect(body.events[0].event_name).toBe('Page Viewed')
  })

  it('ships without a preset so page volume is opt-in', () => {
    const names = (Definition.presets ?? []).map((p) => p.name)
    expect(names).not.toContain('Page Calls')
    expect(Definition.actions.pageView).toBeDefined()
  })
})

describe('GainTrace.pageView batching', () => {
  it('applies the page-name fallback across a whole batch', async () => {
    let body: any
    nock(API_BASE)
      .post('/events', (b) => {
        body = b
        return true
      })
      .reply(201, { data: { results: [{ status: 'inserted' }, { status: 'inserted' }] } })

    await testDestination.executeBatch('pageView', {
      settings,
      events: [
        createTestEvent({ type: 'page', name: 'Pricing', timestamp: '2026-01-01T00:00:00.000Z', userId: 'u1' }),
        createTestEvent({ type: 'page', name: undefined, timestamp: '2026-01-02T00:00:00.000Z', userId: 'u2' })
      ],
      mapping: {
        messageId: { '@path': '$.messageId' },
        eventName: { '@path': '$.name' },
        timestamp: { '@path': '$.timestamp' },
        userId: { '@path': '$.userId' }
      }
    })

    expect(body.events.map((e: any) => e.event_name)).toEqual(['Pricing', 'Page Viewed'])
    expect(body.events.every((e: any) => e.event_category === 'navigation')).toBe(true)
  })
})
