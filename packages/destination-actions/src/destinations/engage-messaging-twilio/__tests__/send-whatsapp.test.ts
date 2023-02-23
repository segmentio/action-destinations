import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import Twilio from '..'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()
const defaultTemplateSid = 'my_template'
const defaultTo = 'whatsapp:+1234567891'

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const settings = {
    twilioAccountSID: 'a',
    twilioApiKeySID: 'f',
    twilioApiKeySecret: 'b',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'c',
    spaceId: 'd',
    sourceId: 'e'
  }
  const getDefaultMapping = (overrides?: any) => {
    return {
      userId: { '@path': '$.userId' },
      from: 'MG1111222233334444',
      contentSid: defaultTemplateSid,
      send: true,
      traitEnrichment: true,
      externalIds: [
        { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
        { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed', channelType: 'whatsapp' }
      ],
      ...overrides
    }
  }

  afterEach(() => {
    twilio.responses = []
    nock.cleanAll()
  })

  describe('send WhatsApp', () => {
    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await twilio.testAction('sendWhatsApp', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [{ type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' }]
        })
      })

      expect(responses.length).toEqual(0)
    })

    it('should abort when there is no `channelType` in the external ID payload', async () => {
      const responses = await twilio.testAction('sendWhatsApp', {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed' }]
        })
      })

      expect(responses.length).toEqual(0)
    })

    it('should send WhatsApp', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping()
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for custom hostname', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo
      })

      const twilioHostname = 'api.nottwilio.com'

      const twilioRequest = nock(`https://${twilioHostname}/2010-04-01/Accounts/a`)
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          twilioHostname
        },
        mapping: getDefaultMapping()
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        `https://${twilioHostname}/2010-04-01/Accounts/a/Messages.json`
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp with custom metadata', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        StatusCallback:
          'http://localhost/?foo=bar&space_id=d&__segment_internal_external_id_key__=phone&__segment_internal_external_id_value__=%2B1234567891#rp=all&rc=5'
      })
      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'http://localhost',
          connectionOverrides: 'rp=all&rc=5'
        },
        mapping: getDefaultMapping({ customArgs: { foo: 'bar' } })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)

      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should fail on invalid webhook url', async () => {
      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'foo'
        },
        mapping: getDefaultMapping({ customArgs: { foo: 'bar' } })
      }
      await expect(twilio.testAction('sendWhatsApp', actionInputData)).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })
  })
  describe('subscription handling', () => {
    it.each(['subscribed', true])('sends an WhatsApp when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'whatsapp' }]
        })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it.each(['unsubscribed', 'did not subscribed', false, null])(
      'does NOT send an WhatsApp when subscriptonStatus ="%s"',
      async (subscriptionStatus) => {
        const expectedTwilioRequest = new URLSearchParams({
          ContentSid: defaultTemplateSid,
          From: 'MG1111222233334444',
          To: defaultTo
        })

        const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
          .post('/Messages.json', expectedTwilioRequest.toString())
          .reply(201, {})

        const actionInputData = {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: 'jane'
          }),
          settings,
          mapping: getDefaultMapping({
            externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus, channelType: 'whatsapp' }]
          })
        }

        const responses = await twilio.testAction('sendWhatsApp', actionInputData)
        expect(responses).toHaveLength(0)
        expect(twilioRequest.isDone()).toEqual(false)
      }
    )

    it('throws an error when subscriptionStatus is unrecognizable"', async () => {
      const randomSubscriptionStatusPhrase = 'some-subscription-enum'

      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo
      })

      nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [
            {
              type: 'phone',
              id: '+1234567891',
              subscriptionStatus: randomSubscriptionStatusPhrase,
              channelType: 'whatsapp'
            }
          ]
        })
      }

      const response = twilio.testAction('sendWhatsApp', actionInputData)
      await expect(response).rejects.toThrowError(
        `Failed to recognize the subscriptionStatus in the payload: "${randomSubscriptionStatusPhrase}".`
      )
    })

    it('formats the to number correctly for whatsapp', async () => {
      const from = 'whatsapp:+19876543210'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: from,
        To: 'whatsapp:+19195551234'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          from: from,
          contentSid: defaultTemplateSid,
          externalIds: [{ type: 'phone', id: '(919) 555 1234', subscriptionStatus: true, channelType: 'whatsapp' }]
        })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('throws an error when whatsapp number cannot be formatted', async () => {
      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          externalIds: [{ type: 'phone', id: 'abcd', subscriptionStatus: true, channelType: 'whatsapp' }]
        })
      }

      const response = twilio.testAction('sendWhatsApp', actionInputData)
      await expect(response).rejects.toThrowError(
        'The string supplied did not seem to be a phone number. Phone number must be able to be formatted to e164 for whatsapp.'
      )
    })

    it('formats and sends content variables', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        ContentVariables: JSON.stringify({ '1': 'Soap', '2': '360 Scope St' })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          contentVariables: { '1': '{{profile.traits.firstName}}', '2': '{{profile.traits.address.street}}' },
          traits: {
            firstName: 'Soap',
            address: {
              street: '360 Scope St'
            }
          }
        })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('omits null/empty content variables', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        ContentVariables: JSON.stringify({ '2': '360 Scope St' })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          contentVariables: { '1': '{{profile.traits.firstName}}', '2': '{{profile.traits.address.street}}' },
          traits: {
            firstName: null,
            address: {
              street: '360 Scope St'
            }
          }
        })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('sends content variables as is when traits are not enriched', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        ContentVariables: JSON.stringify({ '1': 'Soap', '2': '360 Scope St' })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          contentVariables: { '1': 'Soap', '2': '360 Scope St' },
          traitEnrichment: false
        })
      }

      const responses = await twilio.testAction('sendWhatsApp', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })
  })
})
