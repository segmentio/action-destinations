import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import destination from '../index'

const testDestination = createTestIntegration(destination)
const settings = { authToken: 'test-token' }
const timestamp = '2024-01-01T00:00:00.000Z'

const cases: Record<string, { event: ReturnType<typeof createTestEvent>; mapping?: Record<string, unknown> }> = {
  trackEvent: {
    event: createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId: 'user-1',
      timestamp,
      messageId: 'msg-1',
      context: { traits: { email: 'user@example.com' } },
      properties: { total: 10, coupon: 'SAVE' }
    }),
    mapping: { deduplicationValue: { '@path': '$.messageId' } }
  },
  identifyUser: {
    event: createTestEvent({
      type: 'identify',
      userId: 'user-1',
      timestamp,
      traits: { email: 'user@example.com', plan: 'pro' },
      context: { locale: 'en-US', userAgent: 'UA', device: { token: 'tok', type: 'android' } }
    }),
    mapping: {
      timezone: 10,
      pushDevices: [{ token: 'tok', platform: 'android' }],
      topicPreferences: [{ name: 'News', status: 'subscribed' }]
    }
  },
  manageSubscriptions: {
    event: createTestEvent({ type: 'track', userId: 'user-1', timestamp }),
    mapping: { subscriptionAction: 'unsubscribe' }
  },
  manageTags: {
    event: createTestEvent({ type: 'track', userId: 'user-1', timestamp, context: {} }),
    mapping: { tagsToAdd: ['a'], tagsToRemove: ['b'] }
  },
  aliasUser: {
    event: createTestEvent({ type: 'alias', previousId: 'old-id', userId: 'new-id', timestamp })
  }
}

describe('Vero snapshots', () => {
  for (const [actionSlug, { event, mapping }] of Object.entries(cases)) {
    it(`${actionSlug} request`, async () => {
      nock(/.*/).persist().post(/.*/).reply(200, {})
      nock(/.*/).persist().put(/.*/).reply(200, {})

      const responses = await testDestination.testAction(actionSlug, {
        event,
        useDefaultMappings: true,
        mapping,
        settings
      })

      expect(JSON.parse(await responses[0].request.text())).toMatchSnapshot()
      expect(responses[0].url.replace('test-token', 'REDACTED')).toMatchSnapshot()
    })
  }
})
