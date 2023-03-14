import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
// import { eventNames } from 'process'
import Destination from '../../index'
import { API_VERSION } from '../../constants'
import { Settings } from '../../generated-types'
import { SegmentEvent } from '@segment/actions-core'
// import { response } from 'express'

const testDestination = createTestIntegration(Destination)
const event = createTestEvent({
  messageId: 'test-message-rocnz07d5e8',
  timestamp: '1678203524',
  type: 'track',
  userId: 'test-user-fon3evajtr',
  event: 'Segment Test Event Name',
  anonymousId: 'wd86yjukj5o',
  context: {
    active: true,
    app: {
      name: 'InitechGlobal',
      version: '545',
      build: '3.0.1.545',
      namespace: 'com.production.segment'
    },
    device: {
      id: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
      advertisingId: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
      adTrackingEnabled: true,
      manufacturer: 'Apple',
      model: 'iPhone7,2',
      name: 'maguro',
      type: 'ios',
      token: 'ff15bc0c20c4aa6cd50854ff165fd265c838e5405bfeb9571066395b8c9da449'
    },
    os: {
      name: 'iPhone OS',
      version: '8.1.3'
    },
    page: {
      path: '/academy/',
      referrer: '',
      search: '',
      title: 'Analytics Academy',
      url: 'https://segment.com/academy/'
    },
    groupId: '12345',
    timezone: 'Europe/Amsterdam',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
  },
  receivedAt: '2023-03-13T07:56:23.846Z',
  sentAt: '2023-03-13T07:56:23.846Z'
})

const authData: Settings = {
  ad_account_id: 'test_ad_account_id',
  conversion_token: 'test_conversion_token'
}

describe('PinterestConversionApi', () => {
  describe('ReportConversionEvent', () => {
    it('should throw an error when event name is invalid and not from list', async () => {
      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            event_name: 'invalid_event_name',
            action_source: 'web',
            user_data: {
              em: ['test@gmail.com']
            }
          }
        })
      ).rejects.toThrowError()
    })

    it('should throw an error when account source is invalid and not selected from list', async () => {
      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: authData,
          useDefaultMappings: true,
          mapping: {
            event_name: 'checkout',
            action_source: 'invalid_action_source',
            user_data: {
              email: ['test@gmail.com']
            }
          }
        })
      ).rejects.toThrowError()
    })

    it("Should filter the payload from batch that doesn't have required user_data", async () => {
      nock(`https://api.pinterest.com`)
        .post(`/${API_VERSION}/ad_accounts/${authData.ad_account_id}/events`)
        .reply(200, {})
      const events: SegmentEvent[] = [
        event,
        {
          ...event,
          messageId: 'test-message-1234567',
          properties: {
            email: ['test@gmail.com']
          }
        }
      ]

      const responses = await testDestination.testBatchAction('reportConversionEvent', {
        events,
        settings: authData,
        useDefaultMappings: true,
        mapping: {
          event_name: 'checkout',
          action_source: 'web',
          user_data: {
            email: { '@path': '$.properties.email' }
          }
        }
      })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      console.log(responses[0]?.options?.body)
      expect(JSON.parse(responses[0]?.options?.body as string)?.data?.length).toBe(1)
      expect(responses[0].options.json).toMatchSnapshot()
    })
  })
})
