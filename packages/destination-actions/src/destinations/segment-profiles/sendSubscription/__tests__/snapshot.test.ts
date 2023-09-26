import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'

const testDestination = createTestIntegration(destination)
const actionSlug = 'sendSubscription'
const destinationSlug = 'SegmentProfiles'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: true,
        phone: '+12135618345',
        sms_subscription_status: true,
        engage_space: 'engage-space-writekey',
        user_id: 'user12'
      }
    })
    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: { ...settingsData, endpoint: DEFAULT_SEGMENT_ENDPOINT },
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: true,
        phone: '+12135618345',
        sms_subscription_status: true,
        whatsapp_subscription_status: true,
        subscription_groups: {
          marketing: true,
          ProductUpdates: '',
          newsletter: false
        },
        android_push_token: 'abcd12bbfygdbvbvvvv',
        android_push_subscription_status: false,
        ios_push_token: 'abcd12bbfjfsykdbvbvvvvvv',
        ios_push_subscription_status: true,
        engage_space: 'engage-space-writekey',
        user_id: 'user1234'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: { ...settingsData, endpoint: DEFAULT_SEGMENT_ENDPOINT },
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
