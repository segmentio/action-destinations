import nock from 'nock'
import { createTestAction, loggerMock as logger } from './__helpers__/test-utils'
import { Payload } from '../sendMobilePush/generated-types'
import { PushSender } from '../sendMobilePush/push-sender'

const spaceId = 'spaceid'
const contentSid = 'HX1234'
const pushServiceSid = 'ISXXX'

const defaultTemplate = {
  types: {
    ['twilio/text']: {
      body: 'text body'
    }
  }
}

const customizationTitle = 'title'
const defaultExternalId = {
  type: 'ios.push_token',
  id: 'ios-token-1',
  channelType: 'IOS_PUSH',
  subscriptionStatus: 'subscribed'
}

const testAction = createTestAction({
  action: 'sendMobilePush',
  environment: 'production',
  spaceId,
  getMapping: () => ({
    from: pushServiceSid,
    contentSid,
    send: true,
    traitEnrichment: true,
    externalIds: [defaultExternalId],
    customizations: {
      title: customizationTitle,
      tapAction: null,
      deepLink: null,
      sound: null,
      priority: null,
      badgeAmount: null,
      badgeStrategy: null,
      ttl: null,
      tapActionButtons: null
    }
  })
})

const getDefaultExpectedNotifyApiReq = (extId: NonNullable<Payload['externalIds']>[number]) => {
  return new URLSearchParams({
    Body: defaultTemplate.types['twilio/text'].body,
    Title: customizationTitle,
    FcmPayload: JSON.stringify({
      mutable_content: true,
      notification: {
        badge: 1
      }
    }),
    ApnPayload: JSON.stringify({
      aps: {
        'mutable-content': 1,
        badge: 1
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
      badgeAmount: 1,
      badgeStrategy: 'inc',
      __segment_internal_external_id_key__: extId.type,
      __segment_internal_external_id_value__: extId.id
    })
  })
}

describe('sendMobilePush action', () => {
  describe('sending', () => {
    it('should send notification', async () => {
      const externalId = defaultExternalId
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await testAction()
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
    })

    it('should send notification to all subscribed devices', async () => {
      const externalIds = [
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
        },
        {
          type: 'ios.push_token',
          id: 'ios-token-5',
          channelType: 'IOS_PUSH',
          subscriptionStatus: 'false'
        },
        {
          type: 'android.push_token',
          id: 'android-token-5',
          channelType: 'ANDROID_PUSH',
          subscriptionStatus: 'true'
        },
        {
          type: 'ios.push_token',
          id: 'ios-token-6',
          channelType: 'IOS_PUSH',
          subscriptionStatus: 'true'
        }
      ]

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      const eligibleExtIds = externalIds.filter(
        (extId: any) =>
          PushSender.externalIdTypes.includes(extId.type) &&
          PushSender.sendableStatuses.includes(extId.subscriptionStatus.toLowerCase())
      )

      for (const externalId of eligibleExtIds) {
        const body = getDefaultExpectedNotifyApiReq(externalId)
        nock(notifyReqUrl).post('', body.toString()).reply(201, externalId)
      }

      const responses = await testAction({ mappingOverrides: { externalIds } })
      expect(responses.length).toEqual(eligibleExtIds.length + 1)

      for (let i = 1; i < responses.length; i++) {
        expect(responses[i].url).toStrictEqual(notifyReqUrl)
        expect(responses[i].status).toEqual(201)
        expect(responses[i].data).toMatchObject(eligibleExtIds[i - 1])
      }
    })

    it('should send notification with a delivery webhook', async () => {
      const externalId = defaultExternalId
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)
      notifyReqBody.append(
        'DeliveryCallbackUrl',
        `http://localhost.com/?space_id=spaceid&__segment_internal_external_id_key__=${externalId.type}&__segment_internal_external_id_value__=${externalId.id}#rp=all&rc=600`
      )

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await testAction({
        settingsOverrides: {
          webhookUrl: 'http://localhost.com',
          connectionOverrides: 'rp=all&rc=600'
        }
      })
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
    })

    it('should send notification for custom hostname', async () => {
      const externalId = defaultExternalId
      const notifyReqUrl = `https://my-api.com/v1/Services/${pushServiceSid}/Notifications`
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await testAction({
        settingsOverrides: {
          twilioHostname: 'my-api.com'
        }
      })
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
    })
  })

  describe('error handling', () => {
    it('should abort when there is no push notification external ID in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: '6146369272', subscriptionStatus: 'subscribed' }]
        }
      })
      expect(responses.length).toEqual(0)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`not sending push notification, no devices are subscribed - ${spaceId}`),
        expect.any(String)
      )
    })

    it('should abort when send is disabled', async () => {
      const responses = await testAction({ mappingOverrides: { send: false } })
      expect(responses.length).toEqual(0)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`not sending push notification, payload.send = false - ${spaceId}`),
        expect.any(String)
      )
    })

    it('should fail on invalid webhook url', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)

      await expect(
        testAction({
          mappingOverrides: { customArgs: { foo: 'bar' } },
          settingsOverrides: { webhookUrl: 'foo' }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: MOBILEPUSH invalid webhook url - ${spaceId}`),
        expect.any(String)
      )
    })

    it('throws retryable error when all sends fail for retryable reasons', async () => {
      const externalIds = [
        { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' },
        {
          type: 'android.push_token',
          id: 'android-token-2',
          channelType: 'ANDROID_PUSH',
          subscriptionStatus: 'subscribed'
        }
      ]

      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`

      const errorResponse = {
        status: 500,
        code: 30002,
        message: 'bad stuff'
      }
      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[0]).toString()).reply(500, errorResponse)
      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[1]).toString()).reply(500, errorResponse)

      await expect(testAction({ mappingOverrides: { externalIds } })).rejects.toHaveProperty('code', 'RETRYABLE_ERROR')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: MOBILEPUSH failed to send to all subscribed devices - ${spaceId}`),
        expect.any(String)
      )
    })

    it('throws non-retryable error when all sends fail for non-retryable reasons', async () => {
      const externalIds = [
        { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' },
        {
          type: 'android.push_token',
          id: 'android-token-2',
          channelType: 'ANDROID_PUSH',
          subscriptionStatus: 'subscribed'
        }
      ]
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`

      const errorResponse = {
        code: 20004,
        statusCode: 400,
        message: 'bad stuff'
      }
      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[0]).toString()).reply(400, errorResponse)
      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[1]).toString()).reply(400, errorResponse)

      await expect(testAction({ mappingOverrides: { externalIds } })).rejects.toHaveProperty('code', 'UNEXPECTED_ERROR')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: MOBILEPUSH failed to send to all subscribed devices - ${spaceId}`),
        expect.any(String)
      )
    })

    it('does not throw retryable error when at least one send succeeds', async () => {
      const externalIds = [
        { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' },
        { type: 'ios.push_token', id: 'ios-token-2', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' }
      ]
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`

      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[0]).toString()).reply(201, externalIds[0])
      nock(notifyReqUrl).post('', getDefaultExpectedNotifyApiReq(externalIds[1]).toString()).reply(500, externalIds[1])

      const responses = await testAction({ mappingOverrides: { externalIds } })

      expect(responses.length).toEqual(3)
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalIds[0])
      expect(responses[2].url).toStrictEqual(notifyReqUrl)
      expect(responses[2].status).toEqual(500)
      expect(responses[2].data).toMatchObject(externalIds[1])
    })

    it('throws an error when liquid template parsing fails', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)

      await expect(
        testAction({
          mappingOverrides: { customizations: { title: 'hi {{profile.traits.first_name$=}}' } }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`TE Messaging: MOBILEPUSH unable to parse templating - ${spaceId}`),
        expect.any(String)
      )
    })
  })

  describe('liquid template parsing', () => {
    it('parses body, title, and media liquid variables with content sid', async () => {
      const title = '{{profile.traits.first_name}}'
      const template = {
        types: {
          ['twilio/media']: {
            body: 'Welcome to Wadiya General {{profile.traits.first_name}}!',
            media: ['http://myimg.com/&color={{profile.traits.fav_color}}']
          }
        }
      }
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, template)

      const externalIds = [
        { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' }
      ]
      const notifyReqBody = new URLSearchParams({
        Body: 'Welcome to Wadiya General Aladeen!',
        Title: 'Aladeen',
        FcmPayload: JSON.stringify({
          mutable_content: true,
          notification: {
            badge: 1
          }
        }),
        ApnPayload: JSON.stringify({
          aps: {
            'mutable-content': 1,
            badge: 1
          }
        }),
        Recipients: JSON.stringify({
          apn: [{ addr: 'ios-token-1' }]
        }),
        CustomData: JSON.stringify({
          space_id: spaceId,
          badgeAmount: 1,
          badgeStrategy: 'inc',
          media: ['http://myimg.com/&color=mantis_green'],
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          customizations: { title },
          externalIds,
          traits: { first_name: 'Aladeen', fav_color: 'mantis_green' }
        }
      })
      expect(responses[1].url).toEqual(notifyReqUrl)
      expect(responses[1].data).toMatchObject(externalIds[0])
    })

    it('parses body, title, and media liquid variables without content sid', async () => {
      const title = '{{profile.traits.first_name}}'
      const body = 'I have {{profile.traits.health_news_type}} news'
      const media = ['http://myimg.com/&color={{profile.traits.fav_color}}']

      const externalIds = [
        { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' }
      ]

      const notifyReqBody = new URLSearchParams({
        Body: 'I have Aladeeen news',
        Title: 'General',
        FcmPayload: JSON.stringify({
          mutable_content: true,
          notification: {
            badge: 1
          }
        }),
        ApnPayload: JSON.stringify({
          aps: {
            'mutable-content': 1,
            badge: 1
          }
        }),
        Recipients: JSON.stringify({
          apn: [{ addr: 'ios-token-1' }]
        }),
        CustomData: JSON.stringify({
          space_id: spaceId,
          badgeAmount: 1,
          badgeStrategy: 'inc',
          media: ['http://myimg.com/&color=mantis_green'],
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          contentSid: undefined,
          customizations: { title, body, media },
          externalIds,
          traits: { first_name: 'General', health_news_type: 'Aladeeen', fav_color: 'mantis_green' }
        }
      })
      expect(responses[0].url).toEqual(notifyReqUrl)
      expect(responses[0].data).toMatchObject(externalIds[0])
    })
  })

  describe('fields', () => {
    const title = 'buy'
    const body = 'now'
    const tapAction = 'OPEN_DEEP_LINK'
    const sound = 'app://mysound.aif'
    const ttl = 1234
    const priority = 'low'
    const customizations = {
      badgeAmount: 3,
      badgeStrategy: 'dec',
      media: ['http://myimg.com/product.png'],
      deepLink: 'app://propducts-view',
      tapActionButtons: [
        {
          id: '1',
          text: 'open',
          onTap: 'deep_link',
          link: 'app://buy-now'
        },
        {
          id: '2',
          text: 'close',
          onTap: 'dismiss'
        }
      ]
    }

    const externalIds = [
      { type: 'ios.push_token', id: 'ios-token-1', channelType: 'IOS_PUSH', subscriptionStatus: 'subscribed' }
    ]

    it('displays all fields without content sid', async () => {
      const notificationReq = new URLSearchParams({
        Body: body,
        Action: tapAction,
        Title: title,
        Sound: sound,
        Priority: priority,
        TimeToLive: ttl.toString(),
        FcmPayload: JSON.stringify({
          mutable_content: true,
          notification: {
            badge: customizations.badgeAmount
          }
        }),
        ApnPayload: JSON.stringify({
          aps: {
            'mutable-content': 1,
            badge: customizations.badgeAmount
          }
        }),
        Recipients: JSON.stringify({
          apn: [{ addr: 'ios-token-1' }]
        }),
        CustomData: JSON.stringify({
          space_id: spaceId,
          ...customizations,
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(notifyReqUrl).post('', notificationReq.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          contentSid: undefined,
          customizations: { title, body, tapAction, sound, ttl, priority, ...customizations },
          externalIds
        }
      })
      expect(responses[0].url).toEqual(notifyReqUrl)
      expect(responses[0].data).toMatchObject(externalIds[0])
    })

    it('displays all fields with content sid replacements', async () => {
      const template = {
        types: {
          ['twilio/media']: {
            body: 'text body',
            media: ['http://myimg.com/me.png']
          }
        }
      }

      const notificationReq = new URLSearchParams({
        Body: template.types['twilio/media'].body,
        Action: tapAction,
        Title: title,
        Sound: sound,
        Priority: priority,
        TimeToLive: ttl.toString(),
        FcmPayload: JSON.stringify({
          mutable_content: true,
          notification: {
            badge: customizations.badgeAmount
          }
        }),
        ApnPayload: JSON.stringify({
          aps: {
            'mutable-content': 1,
            badge: customizations.badgeAmount
          }
        }),
        Recipients: JSON.stringify({
          apn: [{ addr: 'ios-token-1' }]
        }),
        CustomData: JSON.stringify({
          space_id: spaceId,
          ...customizations,
          media: template.types['twilio/media'].media,
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, template)
      nock(notifyReqUrl).post('', notificationReq.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          contentSid,
          customizations: { title, body, tapAction, sound, ttl, priority, ...customizations },
          externalIds
        }
      })
      expect(responses[1].url).toEqual(notifyReqUrl)
      expect(responses[1].data).toMatchObject(externalIds[0])
    })
  })
})
