import nock from 'nock'
import { createTestAction, expectErrorLogged, expectInfoLogged } from './__helpers__/test-utils'

const defaultTemplateSid = 'my_template'
const phoneNumber = '+1234567891'
const defaultTo = `whatsapp:${phoneNumber}`
const defaultTags = JSON.stringify({
  external_id_type: 'phone',
  external_id_value: phoneNumber
})

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const spaceId = 'd'
  const testAction = createTestAction({
    environment,
    spaceId,
    action: 'sendWhatsApp',
    getMapping: () => ({
      userId: { '@path': '$.userId' },
      from: 'MG1111222233334444',
      contentSid: defaultTemplateSid,
      send: true,
      traitEnrichment: true,
      externalIds: [
        { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
        { type: 'phone', id: phoneNumber, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }
      ]
    })
  })

  describe('send WhatsApp', () => {
    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' }]
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should abort when there are no external IDs in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: []
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should abort when there is an empty `phone` external ID in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: '', subscriptionStatus: 'subscribed' }]
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should abort when there is a null `phone` external ID in the payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: null, subscriptionStatus: 'subscribed' }]
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should abort when there is no `channelType` in the external ID payload', async () => {
      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: phoneNumber, subscriptionStatus: 'subscribed' }]
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should send WhatsApp', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        Tags: defaultTags
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction()
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for partially formatted E164 number in non-default region', async () => {
      // EU number without "+"
      const phone = '441112276181'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: `whatsapp:+${phone}`,
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: phone // expect external id to stay the same.. without "+"
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [
            // EU number without "+"
            { type: 'phone', id: phone, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }
          ]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for fully formatted E164 number in non-default region', async () => {
      // EU number with "+"
      const phone = '+441112276181'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: `whatsapp:${phone}`,
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: phone
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [
            // EU number wtih "+"
            { type: 'phone', id: phone, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }
          ]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for partially formatted E164 number in default region "US"', async () => {
      const phone = '11116369373'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: `whatsapp:+${phone}`,
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: phone
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: phone, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for fully formatted E164 number in default region "US"', async () => {
      const phone = '+11116369373'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: `whatsapp:${phone}`,
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: phone
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: phone, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for fully formatted E164 number for default region "US"', async () => {
      const phone = '+11231233212'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: `whatsapp:${phone}`,
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: phone
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: phone, subscriptionStatus: 'subscribed', channelType: 'whatsapp' }]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send WhatsApp for custom hostname', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        Tags: defaultTags
      })

      const twilioHostname = 'api.nottwilio.com'

      const twilioRequest = nock(`https://${twilioHostname}/2010-04-01/Accounts/a`)
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({ settingsOverrides: { twilioHostname } })
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
        Tags: defaultTags,
        StatusCallback:
          'http://localhost/?foo=bar&space_id=d&__segment_internal_external_id_key__=phone&__segment_internal_external_id_value__=%2B1234567891#rp=all&rc=5'
      })
      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: { customArgs: { foo: 'bar' } },
        settingsOverrides: {
          webhookUrl: 'http://localhost',
          connectionOverrides: 'rp=all&rc=5'
        }
      })

      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should fail on invalid webhook url', async () => {
      await expect(
        testAction({
          mappingOverrides: { customArgs: { foo: 'bar' } },
          settingsOverrides: { webhookUrl: 'foo' }
        })
      ).rejects.toHaveProperty('code', 'PAYLOAD_VALIDATION_FAILED')
      expectErrorLogged('getWebhookUrlWithParams failed')
    })
  })
  describe('subscription handling', () => {
    it.each(['subscribed', true])('sends an WhatsApp when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        Tags: defaultTags
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: phoneNumber, subscriptionStatus, channelType: 'whatsapp' }]
        }
      })
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
          To: defaultTo,
          Tags: defaultTags
        })

        const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
          .post('/Messages.json', expectedTwilioRequest.toString())
          .reply(201, {})

        const responses = await testAction({
          mappingOverrides: {
            externalIds: [{ type: 'phone', id: phoneNumber, subscriptionStatus, channelType: 'whatsapp' }]
          }
        })
        expect(responses).toHaveLength(0)
        expect(twilioRequest.isDone()).toEqual(false)
      }
    )

    it('Unrecognized subscriptionStatus treated as Unsubscribed', async () => {
      const randomSubscriptionStatusPhrase = 'some-subscription-enum'

      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo
      })

      nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          externalIds: [
            {
              type: 'phone',
              id: phoneNumber,
              subscriptionStatus: randomSubscriptionStatusPhrase,
              channelType: 'whatsapp'
            }
          ]
        }
      })
      expect(responses).toHaveLength(0)
      expectInfoLogged('Not sending message because INVALID_SUBSCRIPTION_STATUS')
    })

    it('formats the to number correctly for whatsapp', async () => {
      const from = 'whatsapp:+19876543210'
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: from,
        To: 'whatsapp:+19195551234',
        Tags: JSON.stringify({
          external_id_type: 'phone',
          external_id_value: '(919) 555 1234'
        })
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          from: from,
          contentSid: defaultTemplateSid,
          externalIds: [{ type: 'phone', id: '(919) 555 1234', subscriptionStatus: true, channelType: 'whatsapp' }]
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('throws an error when whatsapp number cannot be formatted', async () => {
      const response = testAction({
        mappingOverrides: {
          externalIds: [{ type: 'phone', id: 'abcd', subscriptionStatus: true, channelType: 'whatsapp' }]
        }
      })
      await expect(response).rejects.toThrowError('Phone number must be able to be formatted to e164 for whatsapp')
      expectErrorLogged('Phone number must be able to be formatted to e164 for whatsapp')
    })

    it('throws an error when liquid template parsing fails', async () => {
      const response = testAction({
        mappingOverrides: {
          contentVariables: { '1': '{{profile.traits.firstName$}}', '2': '{{profile.traits.address.street}}' },
          traits: {
            firstName: 'Soap',
            address: {
              street: '360 Scope St'
            }
          }
        }
      })
      await expect(response).rejects.toThrowError('Unable to parse templating in content variables')
      expectErrorLogged('Unable to parse templating in content variables')
    })

    it('throws an error when Twilio API request fails', async () => {
      const expectedErrorResponse = {
        code: 21211,
        message: "The 'To' number is not a valid phone number.",
        more_info: 'https://www.twilio.com/docs/errors/21211',
        status: 400
      }

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(400, expectedErrorResponse)

      const response = testAction()
      await expect(response).rejects.toThrowError()
      expectErrorLogged('Bad Request')
    })

    it('formats and sends content variables', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        ContentSid: defaultTemplateSid,
        From: 'MG1111222233334444',
        To: defaultTo,
        ContentVariables: JSON.stringify({ '1': 'Soap', '2': '360 Scope St' }),
        Tags: defaultTags
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          contentVariables: { '1': '{{profile.traits.firstName}}', '2': '{{profile.traits.address.street}}' },
          traits: {
            firstName: 'Soap',
            address: {
              street: '360 Scope St'
            }
          }
        }
      })
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
        ContentVariables: JSON.stringify({ '2': '360 Scope St' }),
        Tags: defaultTags
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          contentVariables: { '1': '{{profile.traits.firstName}}', '2': '{{profile.traits.address.street}}' },
          traits: {
            firstName: null,
            address: {
              street: '360 Scope St'
            }
          }
        }
      })
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
        ContentVariables: JSON.stringify({ '1': 'Soap', '2': '360 Scope St' }),
        Tags: defaultTags
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await testAction({
        mappingOverrides: {
          contentVariables: { '1': 'Soap', '2': '360 Scope St' },
          traitEnrichment: false
        }
      })
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })
  })
})
