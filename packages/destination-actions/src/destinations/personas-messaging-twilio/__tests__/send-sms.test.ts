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

  describe(`${environment} - send SMS`, () => {
    it('should abort when there is no `phone` external ID', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })

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
          body: 'Hello world, {{profile.user_id}}!'
        }
      })

      expect(responses.length).toEqual(2)
    })

    it('should send SMS', async () => {
      nock(`${endpoint}/v1/spaces/d/collections/users/profiles/user_id:jane`).get('/traits?limit=200').reply(200, {
        traits: {}
      })

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

      const expectedTwilioRequest = new URLSearchParams()
      expectedTwilioRequest.set('Body', 'Hello world, jane!')
      expectedTwilioRequest.set('From', '+1234567890')
      expectedTwilioRequest.set('To', '+1234567891')

      const twilioRequest = nock('https://api.twilio.com/2010-04-01/Accounts/a')
        .post('/Messages.json', expectedTwilioRequest.toString())
        .reply(201, {})

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
          body: 'Hello world, {{profile.user_id}}!'
        }
      })

      expect(responses.length).toEqual(3)
      expect(twilioRequest.isDone()).toEqual(true)
    })
  })
}
