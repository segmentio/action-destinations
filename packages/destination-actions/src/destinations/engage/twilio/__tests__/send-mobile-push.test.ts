import nock from 'nock'
import { createTestAction, expectErrorLogged, expectInfoLogged } from './__helpers__/test-utils'
import { Payload } from '../sendMobilePush/generated-types'
import { SendabilityStatus } from '../../utils'

const spaceId = 'spaceid'
const contentSid = 'HX1234'
const pushServiceSid = 'ISXXX'
const devices = ['android', 'ios']

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
      link: null,
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
    it.each(devices)('should send %s notification', async (deviceOS: string) => {
      const externalId = {
        type: `${deviceOS}.push_token`,
        id: `${deviceOS}-token`,
        channelType: `${deviceOS.toUpperCase()}_PUSH`,
        subscriptionStatus: 'subscribed'
      }
      const notifyReqBody = getDefaultExpectedNotifyApiReq(externalId)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      nock(notifyReqUrl).post('', notifyReqBody.toString()).reply(201, externalId)

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [externalId]
        }
      })
      expect(responses[1].url).toStrictEqual(notifyReqUrl)
      expect(responses[1].status).toEqual(201)
      expect(responses[1].data).toMatchObject(externalId)
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
      expectInfoLogged(SendabilityStatus.NoSupportedExternalIds.toUpperCase())
    })

    it('should abort when send is disabled', async () => {
      const responses = await testAction({ mappingOverrides: { send: false } })
      expect(responses.length).toEqual(0)
      expectInfoLogged(`Not sending message because`, SendabilityStatus.SendDisabled.toUpperCase())
    })

    it.each(devices)('should abort when %s device is unsubscribed', async (deviceOS: string) => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [
            {
              type: `${deviceOS}.push_token`,
              id: `${deviceOS}-token`,
              channelType: `${deviceOS.toUpperCase()}_PUSH`,
              subscriptionStatus: 'unsubscribed'
            }
          ]
        }
      })
      expect(responses.length).toEqual(0)
      expectInfoLogged(`Not sending message because`, SendabilityStatus.NotSubscribed.toUpperCase())
    })

    it('should fail on invalid webhook url', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)

      await expect(
        testAction({
          mappingOverrides: { customArgs: { foo: 'bar' } },
          settingsOverrides: { webhookUrl: 'foo' }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expectErrorLogged('Invalid webhook url arguments')
    })

    it('throws retryable error when send fails for retryable reasons', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`

      const errorResponse = {
        status: 500,
        code: 30002,
        message: 'bad stuff'
      }
      nock(notifyReqUrl)
        .post('', getDefaultExpectedNotifyApiReq(defaultExternalId).toString())
        .reply(500, errorResponse)

      await expect(testAction()).rejects.toThrowError('Internal Server Error')
      expectErrorLogged('bad stuff')
    })

    it('throws non-retryable error when send fails for non-retryable reasons', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)
      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`

      const errorResponse = {
        code: '20004',
        statusCode: 400,
        message: 'bad data'
      }
      nock(notifyReqUrl)
        .post('', getDefaultExpectedNotifyApiReq(defaultExternalId).toString())
        .reply(400, errorResponse)

      await expect(testAction()).rejects.toThrowError('Bad Request')
      expectErrorLogged('bad data')
    })

    it('throws an error when liquid template parsing fails', async () => {
      nock(`https://content.twilio.com`).get(`/v1/Content/${contentSid}`).reply(200, defaultTemplate)

      await expect(
        testAction({
          mappingOverrides: { customizations: { title: 'hi {{profile.traits.first_name$=}}' } }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expectErrorLogged('Unable to parse templating')
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

    it('parses links in tapActionButtons', async () => {
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
        link: 'app://products-view/{{profile.traits.first_name}}',
        tapActionButtons: [
          {
            id: '1',
            text: 'open',
            onTap: 'deep_link',
            link: 'app://buy-now/{{profile.traits.fav_color}}'
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

      const traits = { first_name: 'Aladeen', fav_color: 'mantis_green' }

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
          badgeAmount: 3,
          badgeStrategy: 'dec',
          media: ['http://myimg.com/product.png'],
          link: 'app://products-view/Aladeen',
          tapActionButtons: [
            {
              id: '1',
              text: 'open',
              onTap: 'deep_link',
              link: 'app://buy-now/mantis_green'
            },
            {
              id: '2',
              text: 'close',
              onTap: 'dismiss'
            }
          ],
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(notifyReqUrl).persist().post('', notificationReq.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          contentSid: undefined,
          customizations: { title, body, tapAction, sound, ttl, priority, ...customizations },
          externalIds,
          traits
        }
      })
      expect(responses[0].url).toEqual(notifyReqUrl)
      expect(responses[0].data).toMatchObject(externalIds[0])
      const options = new URLSearchParams(responses[0].options?.body?.toString())
      const parsedCustomData = JSON.parse(options?.get('CustomData') ?? '{}')
      expect(parsedCustomData.link).toEqual('app://products-view/Aladeen')
      expect(parsedCustomData.tapActionButtons[0].link).toEqual('app://buy-now/mantis_green')
    })
  })

  describe('fields', () => {
    const title = 'buy'
    const body = 'now'
    const tapAction = 'MY_OWN_ACTION'
    const sound = 'app://mysound.aif'
    const ttl = 1234
    const priority = 'low'
    const customizations = {
      badgeAmount: 3,
      badgeStrategy: 'dec',
      media: ['http://myimg.com/product.png'],
      link: 'app://propducts-view',
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

    it('sets deep link tap action preset', async () => {
      const notificationReq = new URLSearchParams({
        Body: body,
        Action: 'deep_link',
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
          customizations: { title, body, sound, ttl, priority, tapAction: 'open_app', ...customizations },
          externalIds
        }
      })
      expect(responses[0].url).toEqual(notifyReqUrl)
      expect(responses[0].data).toMatchObject(externalIds[0])
    })

    it('sets deep link tap action preset on tap action buttons', async () => {
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
          ...{
            ...customizations,
            tapActionButtons: [
              {
                id: '1',
                text: 'open',
                onTap: 'deep_link',
                link: 'app://buy-now'
              }
            ]
          },
          __segment_internal_external_id_key__: 'ios.push_token',
          __segment_internal_external_id_value__: 'ios-token-1'
        })
      })

      const notifyReqUrl = `https://push.ashburn.us1.twilio.com/v1/Services/${pushServiceSid}/Notifications`
      nock(notifyReqUrl).post('', notificationReq.toString()).reply(201, externalIds[0])

      const responses = await testAction({
        mappingOverrides: {
          contentSid: undefined,
          customizations: {
            title,
            body,
            sound,
            ttl,
            priority,
            tapAction,
            ...{
              ...customizations,
              tapActionButtons: [
                {
                  id: '1',
                  text: 'open',
                  onTap: 'open_app',
                  link: 'app://buy-now'
                }
              ]
            }
          },
          externalIds
        }
      })
      expect(responses[0].url).toEqual(notifyReqUrl)
      expect(responses[0].data).toMatchObject(externalIds[0])
    })

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
