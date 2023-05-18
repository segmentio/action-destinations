import nock from 'nock'
import Twilio from '..'
import { createTestIntegration } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import { createLoggerMock } from './test-utils'
import { Payload } from '../sendPush/generated-types'
import { InputData } from '@segment/actions-core/src/mapping-kit'
import { PushSender } from '../sendPush/push-sender'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()
const spaceId = 'spaceid'
const contentSid = 'HX1234'
const pushServiceSid = 'ISXXX'
const loggerMock = createLoggerMock()

const defaultTemplate = {
  types: {
    ['twilio/text']: {
      body: 'text body'
    }
  }
}

const getActionPayload = (mappingOverrides?: any, settingsOverrides?: any): [string, InputData] => [
  'sendPush',
  {
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
    logger: loggerMock
  }
]

const [actionName, defaultActionInput] = <[string, any]>getActionPayload()
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

describe('sendPush', () => {
  afterEach(() => {
    twilio.responses = []
    nock.cleanAll()
  })

  describe('send push notification', () => {
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
      const [actionName, input] = <[string, any]>getActionPayload({
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
          { type: 'email', id: 'me@mail.com', subscriptionStatus: 'subscribed' }
        ]
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
      const [actionName, input] = <[string, any]>getActionPayload(null, {
        webhookUrl: 'http://localhost.com',
        connectionOverrides: 'rp=all&rc=600'
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
  })

  describe.only('error handling', () => {
    it('should abort when there is no push notification external ID in the payload', async () => {
      const responses = await twilio.testAction(
        ...getActionPayload({
          externalIds: [{ type: 'phone', id: '6146369272', subscriptionStatus: 'subscribed' }]
        })
      )
      expect(responses.length).toEqual(0)
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Not sending message, no devices are subscribed'),
        expect.any(String)
      )
    })

    it('should abort when send is disabled', async () => {
      const responses = await twilio.testAction(...getActionPayload({ send: false }))
      expect(responses.length).toEqual(0)
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining(`Not sending message, payload.send = false`),
        expect.any(String)
      )
    })

    it('should fail on invalid webhook url', async () => {
      const responses = await twilio.testAction(...getActionPayload(null, { webhookUrl: 'inv' }))
      await expect(responses).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })

    //   it('should send WhatsApp for custom hostname', async () => {
    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: 'MG1111222233334444',
    //       To: defaultTo
    //     })

    //     const twilioHostname = 'api.nottwilio.com'

    //     const twilioRequest = nock(`https://${twilioHostname}/2010-04-01/Accounts/a`)
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings: {
    //         ...settings,
    //         twilioHostname
    //       },
    //       mapping: getDefaultMapping()
    //     }

    //     const responses = await twilio.testAction('sendPush', actionInputData)
    //     expect(responses.map((response) => response.url)).toStrictEqual([
    //       `https://${twilioHostname}/2010-04-01/Accounts/a/Messages.json`
    //     ])
    //     expect(twilioRequest.isDone()).toEqual(true)
    //   })

    //   it('should send WhatsApp with custom metadata', async () => {
    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: 'MG1111222233334444',
    //       To: defaultTo,
    //       StatusCallback:
    //         'http://localhost/?foo=bar&space_id=d&__segment_internal_external_id_key__=phone&__segment_internal_external_id_value__=%2B1234567891#rp=all&rc=5'
    //     })
    //     const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings: {
    //         ...settings,
    //         webhookUrl: 'http://localhost',
    //         connectionOverrides: 'rp=all&rc=5'
    //       },
    //       mapping: getDefaultMapping({ customArgs: { foo: 'bar' } })
    //     }

    //     const responses = await twilio.testAction('sendPush', actionInputData)

    //     expect(responses.map((response) => response.url)).toStrictEqual([
    //       'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
    //     ])
    //     expect(twilioRequest.isDone()).toEqual(true)
    //   })

    // describe('content', () => {
    //   it('formats and sends content variables', async () => {
    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: 'MG1111222233334444',
    //       To: defaultTo,
    //       ContentVariables: JSON.stringify({ '1': 'Soap', '2': '360 Scope St' })
    //     })

    //     const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         contentVariables: { '1': '{{profile.traits.firstName}}', '2': '{{profile.traits.address.street}}' },
    //         traits: {
    //           firstName: 'Soap',
    //           address: {
    //             street: '360 Scope St'
    //           }
    //         }
    //       })
    //     }

    //     const responses = await twilio.testAction('sendPush', actionInputData)
    //     expect(responses.map((response) => response.url)).toStrictEqual([
    //       'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
    //     ])
    //     expect(twilioRequest.isDone()).toEqual(true)
    //   })
    // })

    // describe('subscription handling', () => {
    //   it.each(['subscribed', true])('sends an WhatsApp when subscriptonStatus ="%s"', async (subscriptionStatus) => {
    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: 'MG1111222233334444',
    //       To: defaultTo
    //     })

    //     const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'whatsapp' }]
    //       })
    //     }

    //     const responses = await twilio.testAction('sendPush', actionInputData)
    //     expect(responses.map((response) => response.url)).toStrictEqual([
    //       'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
    //     ])
    //     expect(twilioRequest.isDone()).toEqual(true)
    //   })

    //   it.each(['unsubscribed', 'did not subscribed', false, null])(
    //     'does NOT send an WhatsApp when subscriptonStatus ="%s"',
    //     async (subscriptionStatus) => {
    //       const expectedTwilioRequest = new URLSearchParams({
    //         ContentSid: defaultTemplateSid,
    //         From: 'MG1111222233334444',
    //         To: defaultTo
    //       })

    //       const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //         .post('/Messages.json', expectedTwilioRequest.toString())
    //         .reply(201, {})

    //       const actionInputData = {
    //         event: createMessagingTestEvent({
    //           timestamp,
    //           event: 'Audience Entered',
    //           userId: 'jane'
    //         }),
    //         settings,
    //         mapping: getDefaultMapping({
    //           externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'whatsapp' }]
    //         })
    //       }

    //       const responses = await twilio.testAction('sendPush', actionInputData)
    //       expect(responses).toHaveLength(0)
    //       expect(twilioRequest.isDone()).toEqual(false)
    //     }
    //   )

    //   it('throws an error when subscriptionStatus is unrecognizable"', async () => {
    //     const randomSubscriptionStatusPhrase = 'some-subscription-enum'

    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: 'MG1111222233334444',
    //       To: defaultTo
    //     })

    //     nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         externalIds: [
    //           {
    //             type: 'phone',
    //             id: '+1234567891',
    //             subscriptionStatus: randomSubscriptionStatusPhrase,
    //             channelType: 'whatsapp'
    //           }
    //         ]
    //       })
    //     }

    //     const response = twilio.testAction('sendPush', actionInputData)
    //     await expect(response).rejects.toThrowError(
    //       `Failed to recognize the subscriptionStatus in the payload: "${randomSubscriptionStatusPhrase}".`
    //     )
    //   })

    //   it('formats the to number correctly for whatsapp', async () => {
    //     const from = 'whatsapp:+19876543210'
    //     const expectedTwilioRequest = new URLSearchParams({
    //       ContentSid: defaultTemplateSid,
    //       From: from,
    //       To: 'whatsapp:+19195551234'
    //     })

    //     const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
    //       .post('/Messages.json', expectedTwilioRequest.toString())
    //       .reply(201, {})

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         from: from,
    //         contentSid: defaultTemplateSid,
    //         externalIds: [{ type: 'phone', id: '(919) 555 1234', subscriptionStatus: true, channelType: 'whatsapp' }]
    //       })
    //     }

    //     const responses = await twilio.testAction('sendPush', actionInputData)
    //     expect(responses.map((response) => response.url)).toStrictEqual([
    //       'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
    //     ])
    //     expect(twilioRequest.isDone()).toEqual(true)
    //   })

    //   it('throws an error when whatsapp number cannot be formatted', async () => {
    //     const logErrorSpy = jest.fn() as Logger['error']

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         externalIds: [{ type: 'phone', id: 'abcd', subscriptionStatus: true, channelType: 'whatsapp' }]
    //       }),
    //       logger: { level: 'error', name: 'test', error: logErrorSpy } as Logger
    //     }

    //     const response = twilio.testAction('sendPush', actionInputData)
    //     await expect(response).rejects.toThrowError(
    //       'The string supplied did not seem to be a phone number. Phone number must be able to be formatted to e164 for whatsapp.'
    //     )
    //     expect(logErrorSpy).toHaveBeenCalledWith(
    //       expect.stringMatching(new RegExp(`^TE Messaging: WhatsApp invalid phone number - ${spaceId}`))
    //     )
    //   })

    //   it('throws an error when liquid template parsing fails', async () => {
    //     const logErrorSpy = jest.fn() as Logger['error']

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping({
    //         contentVariables: { '1': '{{profile.traits.firstName$}}', '2': '{{profile.traits.address.street}}' },
    //         traits: {
    //           firstName: 'Soap',
    //           address: {
    //             street: '360 Scope St'
    //           }
    //         }
    //       }),
    //       logger: { level: 'error', name: 'test', error: logErrorSpy } as Logger
    //     }

    //     const response = twilio.testAction('sendPush', actionInputData)
    //     await expect(response).rejects.toThrowError('Unable to parse templating in content variables')
    //     expect(logErrorSpy).toHaveBeenCalledWith(
    //       expect.stringMatching(
    //         new RegExp(`^TE Messaging: Failed to parse WhatsApp template with content variables - ${spaceId}`)
    //       )
    //     )
    //   })

    //   it('throws an error when Twilio API request fails', async () => {
    //     const logErrorSpy = jest.fn() as Logger['error']

    //     const expectedErrorResponse = {
    //       code: 21211,
    //       message: "The 'To' number is not a valid phone number.",
    //       more_info: 'https://www.twilio.com/docs/errors/21211',
    //       status: 400
    //     }

    //     nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(400, expectedErrorResponse)

    //     const actionInputData = {
    //       event: createMessagingTestEvent({
    //         timestamp,
    //         event: 'Audience Entered',
    //         userId: 'jane'
    //       }),
    //       settings,
    //       mapping: getDefaultMapping(),
    //       logger: { level: 'error', name: 'test', error: logErrorSpy } as Logger
    //     }

    //     const response = twilio.testAction('sendPush', actionInputData)
    //     await expect(response).rejects.toThrowError()
    //     expect(logErrorSpy).toHaveBeenCalledWith(
    //       `TE Messaging: Twilio Programmable API error - ${spaceId} - [${JSON.stringify(expectedErrorResponse)}]`
    //     )
    //   })
  })
})
