import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { createMessagingTestEvent } from '../../../lib/engage-test-data/create-messaging-test-event'
import Twilio from '..'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()

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
      body: 'Hello world, {{profile.user_id}}!',
      send: true,
      traitEnrichment: true,
      externalIds: [
        { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
        { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed' }
      ],
      ...overrides
    }
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  afterEach(() => {
    twilio.responses = []
  })

  describe('send SMS', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await twilio.testAction('sendSms', {
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
    it('should throw error with no userId and no trait enrichment', async () => {
      const mapping = getDefaultMapping({
        userId: undefined,
        traitEnrichment: false
      })
      await expect(
        twilio.testAction('sendSms', {
          event: createMessagingTestEvent({
            timestamp,
            event: 'Audience Entered',
            userId: 'jane'
          }),
          settings,
          mapping
        })
      ).rejects.toThrowError('Unable to process sms, no userId provided and no traits provided')
    })

    it('should throw error if unable to parse liquid template', async () => {
      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          body: 'Hello world, {{profile.user_id$}}!!'
        })
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to parse templating in SMS'
      )
    })

    it('should throw error if Twilio API request fails', async () => {
      nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json')
        .reply(400, {
          response: {
            data: {
              code: 21211,
              message: "The 'to' number is not a valid phone number.",
              more_info: 'https://www.twilio.com/docs/errors/21211',
              status: 400
            }
          }
        })

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping()
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError()
    })

    it('should send SMS', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891'
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

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send SMS for custom hostname', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891'
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

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        `https://${twilioHostname}/2010-04-01/Accounts/a/Messages.json`
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send SMS with custom metadata', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
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

      const responses = await twilio.testAction('sendSms', actionInputData)

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
      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })
  })
  describe('subscription handling', () => {
    beforeEach(() => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it.each(['subscribed', true])('sends an SMS when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891'
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
        mapping: getDefaultMapping({ externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus }] })
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it.each(['unsubscribed', 'did not subscribed', false, null])(
      'does NOT send an SMS when subscriptonStatus ="%s"',
      async (subscriptionStatus) => {
        const expectedTwilioRequest = new URLSearchParams({
          Body: 'Hello world, jane!',
          From: 'MG1111222233334444',
          To: '+1234567891'
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
          mapping: getDefaultMapping({ externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus }] })
        }

        const responses = await twilio.testAction('sendSms', actionInputData)
        expect(responses).toHaveLength(0)
        expect(twilioRequest.isDone()).toEqual(false)
      }
    )

    it('throws an error when subscriptionStatus is unrecognizable"', async () => {
      const randomSubscriptionStatusPhrase = 'some-subscription-enum'

      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891'
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
          externalIds: [{ type: 'phone', id: '+1234567891', subscriptionStatus: randomSubscriptionStatusPhrase }]
        })
      }

      const response = twilio.testAction('sendSms', actionInputData)
      await expect(response).rejects.toThrowError(
        `Failed to recognize the subscriptionStatus in the payload: "${randomSubscriptionStatusPhrase}".`
      )
    })
  })

  describe('get profile traits', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('should throw error if unable to request profile traits', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(500)

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping({
          traitEnrichment: false
        })
      }

      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toThrowError(
        'Unable to get profile traits for SMS message'
      )
    })

    it('should get profile traits successfully', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: { 'profile.user_id': 'jane' }
        })

      nock('https://api.twilio.com/2010-04-01/Accounts/a').post('/Messages.json').reply(201, {})

      const actionInputData = {
        event: createMessagingTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: getDefaultMapping()
      }

      await expect(twilio.testAction('sendSms', actionInputData)).resolves.not.toThrowError()
    })
  })
})
