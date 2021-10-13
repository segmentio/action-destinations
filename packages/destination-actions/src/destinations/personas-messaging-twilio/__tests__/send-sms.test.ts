import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Twilio from '..'

const twilio = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()

for (const environment of ['stage', 'production']) {
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

  describe(`${environment} - send SMS`, () => {
    it('should abort when there is no `phone` external ID', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/external_ids?limit=25')
        .reply(200, {
          data: [
            {
              type: 'user_id',
              id: 'jane'
            }
          ]
        })

      const responses = await twilio.testAction('sendSms', {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromNumber: '+1234567890',
          body: 'Hello world, {{profile.user_id}}!',
          send: true
        }
      })

      expect(responses.length).toEqual(2)
    })

    const testSendSms = async (expectedTwilioRequest: any, actionInputData: any) => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/external_ids?limit=25')
        .reply(200, {
          data: [
            {
              type: 'user_id',
              id: 'jane'
            },
            {
              type: 'phone',
              id: '+1234567891'
            }
          ]
        })

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

      const responses = await twilio.testAction('sendSms', actionInputData)

      expect(responses.map((response) => response.url)).toStrictEqual([
        `${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane/traits?limit=200`,
        `${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane/external_ids?limit=25`,
        'https://api.twilio.com/2010-04-01/Accounts/a/Messages.json'
      ])
      expect(twilioRequest.isDone()).toEqual(true)
    }

    it('should send SMS', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: '+1234567890',
        To: '+1234567891'
      })
      const actionInputData = {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromNumber: '+1234567890',
          body: 'Hello world, {{profile.user_id}}!',
          send: true
        }
      }

      await testSendSms(expectedTwilioRequest, actionInputData)
    })

    it('should send SMS with custom metadata', async () => {
      const expectedTwilioRequest = new URLSearchParams({
        Body: 'Hello world, jane!',
        From: '+1234567890',
        To: '+1234567891',
        StatusCallback: 'http://localhost/?foo=bar'
      })

      const actionInputData = {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings: {
          ...settings,
          webhookUrl: 'http://localhost'
        },
        mapping: {
          userId: { '@path': '$.userId' },
          fromNumber: '+1234567890',
          body: 'Hello world, {{profile.user_id}}!',
          customArgs: {
            foo: 'bar'
          },
          send: true
        }
      }

      await testSendSms(expectedTwilioRequest, actionInputData)
    })

    it('should fail on invalid webhook url', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`)
        .get('/external_ids?limit=25')
        .reply(200, {
          data: [
            {
              type: 'user_id',
              id: 'jane'
            },
            {
              type: 'phone',
              id: '+1234567891'
            }
          ]
        })

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
          fromNumber: '+1234567890',
          body: 'Hello world, {{profile.user_id}}!',
          customArgs: {
            foo: 'bar'
          },
          send: true
        }
      }
      await expect(twilio.testAction('sendSms', actionInputData)).rejects.toHaveProperty('code', 'ERR_INVALID_URL')
    })
  })
}
