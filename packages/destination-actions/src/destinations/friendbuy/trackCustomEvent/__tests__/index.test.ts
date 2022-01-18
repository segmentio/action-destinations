import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { mapiUrl } from '../../cloudUtil'
// import { get } from '@segment/actions-core'
import { nockAuth, authKey, authSecret } from '../../__tests__/cloudUtil.mock'

const testDestination = createTestIntegration(Destination)

describe('Friendbuy.trackCustomEvent', () => {
  test('all fields', async () => {
    nockAuth()
    nock(mapiUrl).persist().post('/v1/event/custom').reply(200, {})

    const userId = 'john-doe-1234'
    const anonymousId = '960efa33-6d3b-4eb9-a4e7-d95412d9829e'

    const doTest = async (_testName: string, eventProps: Record<string, any>, expectedPayload: any) => {
      const event = createTestEvent({
        type: 'track',
        event: 'Download',
        ...eventProps
      })

      const r = await testDestination.testAction('trackCustomEvent', {
        event,
        settings: { authKey, authSecret },
        useDefaultMappings: true
        // mapping,
        // auth,
      })

      expect(r.length).toBeGreaterThanOrEqual(1) // maybe auth request + trackCustomEvent request
      expect(r[r.length - 1].options.json).toEqual(expectedPayload)
    }

    const couponCode = 'coupon-thx1138'
    const attributionId = '526f8824-984c-4ba3-aa4b-feb5cbdc1c3f'
    const referralCode = 'referral-luh3417'

    await doTest(
      'download events are sent',
      {
        userId,
        anonymousId,
        properties: {
          type: 'application',
          fileId: 'MyApp',
          deduplicationId: '1234',
          coupon: couponCode,
          attributionId,
          referralCode
        }
      },
      {
        eventType: 'Download',
        deduplicationId: '1234',
        couponCode,
        attributionId,
        referralCode,
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        additionalProperties: {
          anonymousId,
          customerId: userId,
          fileId: 'MyApp',
          pageTitle: expect.any(String),
          pageUrl: expect.any(String),
          type: 'application'
        }
      }
    )

    const email = 'john.doe@example.com'
    const isNewCustomer = false
    const firstName = 'John'
    const lastName = 'Doe'

    await doTest(
      'customer is sent if fields present',
      {
        userId,
        anonymousId,
        properties: {
          type: 'video',
          fileId: 'video-1234',
          email,
          isNewCustomer,
          firstName,
          lastName
        }
      },
      {
        eventType: 'Download',
        email,
        isNewCustomer,
        firstName,
        lastName,
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        additionalProperties: {
          anonymousId,
          customerId: userId,
          fileId: 'video-1234',
          pageTitle: expect.any(String),
          pageUrl: expect.any(String),
          type: 'video'
        }
      }
    )
  })
})
