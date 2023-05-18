import nock from 'nock'
import Twilio from '..'
import { createTestIntegration } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import { createLoggerMock } from '../utils/test-utils'
import { Payload } from '../sendPush/generated-types'
import { InputData } from '@segment/actions-core/src/mapping-kit'
import { PushSender } from '../sendPush/push-sender'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()
const spaceId = 'spaceid'
const contentSid = 'HX1234'
const pushServiceSid = 'ISXXX'
const logger = createLoggerMock()

const defaultTemplate = {
  types: {
    ['twilio/text']: {
      body: 'text body'
    }
  }
}
const actionName = 'sendPush'
interface GetActionPayloadProps {
  mappingOverrides?: any
  settingsOverrides?: any
}
const getActionPayload = ({ mappingOverrides, settingsOverrides }: GetActionPayloadProps = {}): InputData => ({
  event: createMessagingTestEvent({
    timestamp,
    event: 'Audience Entered',
    userId: 'jane'
  }),
  mapping: {
    from: pushServiceSid,
    contentSid,
    send: true,
    traitEnrichment: true,
    externalIds: [
      { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' }
    ],
    customizations: {
      title: 'title',
      tapAction: null,
      deepLink: null,
      sound: null,
      priority: null,
      badgeAmount: null,
      badgeStrategy: null,
      ttl: null
    },
    ...mappingOverrides
  } as Payload,
  settings: {
    spaceId,
    sourceId: 'sourceid',
    twilioAccountSID: 'asid',
    twilioApiKeySID: 'apikeysid',
    twilioApiKeySecret: 'apikeysecret',
    profileApiEnvironment: 'production',
    profileApiAccessToken: 'profileaccesstoken',
    ...settingsOverrides
  },
  logger
})

const defaultActionInput: any = getActionPayload()
const getDefaultExpectedNotifyApiReq = (extId: NonNullable<Payload['externalIds']>[number]) => {
  return new URLSearchParams({
    Body: defaultTemplate.types['twilio/text'].body,
    Title: defaultActionInput.mapping.customizations.title,
    FcmPayload: JSON.stringify({
      mutable_content: true
    }),
    ApnPayload: JSON.stringify({
      aps: {
        'mutable-content': 1
      }
    }),
    Recipients:
      extId.type === 'ios.push_token'
        ? JSON.stringify({
            apn: [{ addr: extId.id }]
          })
        : JSON.stringify({
            fcm: [{ addr: extId.id }]
          }),
    CustomData: JSON.stringify({
      space_id: spaceId,
      __segment_internal_external_id_key__: extId.type,
      __segment_internal_external_id_value__: extId.id
    })
  })
}

describe('sendPush action', () => {
  afterEach(() => {
    twilio.responses = []
    nock.cleanAll()
  })

  describe('sending', () => {
    it('should send notification', async () => {
      const externalId = defaultActionInput.mapping.externalIds[0]
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await twilio.testAction(actionName, defaultActionInput)
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
    })

    it('should send notification to all subscribed devices', async () => {
      const input: any = getActionPayload({
        mappingOverrides: {
          externalIds: [
            { type: 'phone', id: '6161116611', channelType: 'SMS', subscriptionStatus: 'subscribed' },
            { type: 'phone', id: '6161116611', channelType: 'WHATSAPP', subscriptionStatus: 'subscribed' },
            { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' },
            { type: 'ios.push_token', id: 'ios-token-2', channelType: 'IOS_PUSH', subscriptionStatus: 'unsubscribed' },
            {
              type: 'android.push_token',
              id: 'android-token-1',
              channelType: 'ANDROID_PUSH',
              subscriptionStatus: 'subscribed'
            },
            { type: 'email', id: 'me@mail.com', subscriptionStatus: 'subscribed' },
            {
              type: 'ios.push_token',
              id: 'ios-token-3',
              channelType: 'IOS_PUSH',
              subscriptionStatus: 'did-not-subscribe'
            },
            {
              type: 'android.push_token',
              id: 'android-token-2',
              channelType: 'ANDROID_PUSH',
              subscriptionStatus: 'did-not-subscribe'
            },
            { type: 'ios.push_token', id: 'ios-token-4', channelType: 'IOS_PUSH', subscriptionStatus: 'false' },
            {
              type: 'android.push_token',
              id: 'android-token-4',
              channelType: 'ANDROID_PUSH',
              subscriptionStatus: 'false'
            }
          ]
        }
      })

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      const eligibleExtIds = input.mapping.externalIds.filter(
        (extId: any) => PushSender.externalIdTypes.includes(extId.type) && extId.subscriptionStatus === 'subscribed'
      )

      for (const externalId of eligibleExtIds) {
        const body = getDefaultExpectedNotifyApiReq(externalId)
        nock(notifyReqUrl).post('', body.toString()).reply(201, externalId)
      }

      const responses = await twilio.testAction(actionName, input)

      expect(responses.length).toEqual(3)
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(input.mapping.externalIds[2])
      expect(responses[2].url).toStrictEqual(notifyReqUrl)
      expect(responses[2].status).toEqual(201)
      expect(responses[2].data).toMatchObject(input.mapping.externalIds[4])
    })

    it('should send notification with a delivery webhook', async () => {
      const input: any = getActionPayload({
        settingsOverrides: {
          webhookUrl: 'http://localhost.com',
          connectionOverrides: 'rp=all&rc=600'
        }
      })
      const externalId = input.mapping.externalIds[0]
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)
      notifyReqBody.append(
        'DeliveryCallbackUrl',
        `http://localhost.com/?space_id=spaceid&__segment_internal_external_id_key__=${externalId.type}&__segment_internal_external_id_value__=${externalId.id}#rp=all&rc=600`
      )

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await twilio.testAction(actionName, input)
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
    })

    it.todo('should send notification for custom hostname')
  })

  describe('error handling', () => {
    it('should abort when there is no push notification external ID in the payload', async () => {
      const responses = await twilio.testAction(
        actionName,
        getActionPayload({
          mappingOverrides: {
            externalIds: [{ type: 'phone', id: '6146369272', subscriptionStatus: 'subscribed' }]
          }
        })
      )
      expect(responses.length).toEqual(0)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Not sending message, no devices are subscribed'),
        expect.any(String)
      )
    })

    it('should abort when send is disabled', async () => {
      const responses = await twilio.testAction(actionName, getActionPayload({ mappingOverrides: { send: false } }))
      expect(responses.length).toEqual(0)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Not sending message, payload.send = false`),
        expect.any(String)
      )
    })

    it('should fail on invalid webhook url', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)

      await expect(
        twilio.testAction(
          actionName,
          getActionPayload({
            mappingOverrides: { customArgs: { foo: 'bar' } },
            settingsOverrides: { webhookUrl: 'foo' }
          })
        )
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: PUSH invalid webhook url`),
        expect.any(String)
      )
    })

    it.todo('throws an error when liquid template parsing fails')
    it.todo('throws an error when Twilio API request fails')
  })

  describe('liquid template parsing', () => {
    it.todo('parses body, title, and media liquid variables')
  })
})
