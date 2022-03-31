import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Twilio from '..'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()

describe.each(['stage', 'production'])('%s environment', (environment) => {
  const settings = {
    twilioAccountId: 'a',
    twilioAuthToken: 'b',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'c',
    spaceId: 'd',
    sourceId: 'e'
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  beforeEach(() => {
    nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
      traits: {}
    })
  })

  afterEach(() => {
    twilio.responses = []
    nock.cleanAll()
  })

  describe('send SMS', () => {
    it('should abort when there is no `phone` external ID in the payload', async () => {
      const responses = await twilio.testAction('sendSms', {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          send: true,
          externalIds: [
            { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' }
          ]
        }
      })

      expect(responses.length).toEqual(0)
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
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          send: true,
          externalIds: [
            { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
            { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed' }
          ]
        }
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        `${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane/traits?limit=200`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should send SMS with custom metadata', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891',
        StatusCallback:
          'http://localhost/?foo=bar&__segment_internal_external_id_key__=phone&__segment_internal_external_id_value__=%2B1234567891#rp=all&rc=5'
      })
      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'http://localhost',
          connectionOverrides: 'rp=all&rc=5'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          customArgs: {
            foo: 'bar'
          },
          send: true,
          externalIds: [
            { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
            { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed' }
          ]
        }
      }

      const responses = await twilio.testAction('sendSms', actionInputData)

      expect(responses.map((response) => response.url)).toStrictEqual([
        `${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane/traits?limit=200`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it('should fail on invalid webhook url', async () => {
      const actionInputData = {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'foo'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          customArgs: {
            foo: 'bar'
          },
          send: true,
          externalIds: [
            { type: 'email', id: 'test@twilio.com', subscriptionStatus: 'subscribed' },
            { type: 'phone', id: '+1234567891', subscriptionStatus: 'subscribed' }
          ]
        }
      }
      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })
  })
  describe('subscription handling', () => {
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
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          send: true,
          externalIds: [
            { type: 'phone', id: '+1234567891', subscriptionStatus }
          ]
        }
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses.map((response) => response.url)).toStrictEqual([
        `${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane/traits?limit=200`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    })

    it.each([
      'unsubscribed',
      'did not subscribed',
      false,
      null
    ])('does NOT send an SMS when subscriptonStatus ="%s"', async (subscriptionStatus) => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: 'MG1111222233334444',
        To: '+1234567891'
      })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const actionInputData = {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          send: true,
          externalIds: [
            { type: 'phone', id: '+1234567891', subscriptionStatus }
          ]
        }
      }

      const responses = await twilio.testAction('sendSms', actionInputData)
      expect(responses).toHaveLength(0)
      expect(twilioRequest.isDone()).toEqual(false)
    })

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
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          from: 'MG1111222233334444',
          body: 'Hello world, {{profile.user_id}}!',
          send: true,
          externalIds: [
            { type: 'phone', id: '+1234567891', subscriptionStatus: randomSubscriptionStatusPhrase }
          ]
        }
      }

      const response = twilio.testAction('sendSms', actionInputData)
      await expect(response).rejects.toThrowError(`Failed to recognize the subscriptionStatus in the payload: "${randomSubscriptionStatusPhrase}".`)
    })
  })
})
