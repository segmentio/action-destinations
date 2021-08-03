import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Sendgrid from '..'

const sendgrid = createTestIntegration(Sendgrid)
const timestamp = new Date().toISOString()

for (const environment of ['stage', 'production']) {
  const settings = {
    sendGridApiKey: 'sendGridApiKey',
    sourceId: 'sourceId',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'profileApiAccessToken',
    profileApiSpaceId: 'profileApiSpaceId'
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  describe(`${environment} - send Email`, () => {
    it('should send Email', async () => {
      nock(`${endpoint}/v1/spaces/profileApiSpaceId/collections/users/profiles/user_id:jane`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: {}
        })

      nock(`${endpoint}/v1/spaces/profileApiSpaceId/collections/users/profiles/user_id:jane`)
        .get('/external_ids?limit=25')
        .reply(200, {
          data: [
            {
              type: 'user_id',
              id: 'jane'
            },
            {
              type: 'email',
              id: 'test@example.com'
            }
          ]
        })

      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: 'test@example.com',
                name: 'Test User'
              }
            ],
            custom_args: {
              source_id: settings.sourceId,
              space_id: settings.profileApiSpaceId,
              user_id: 'jane'
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        subject: 'Test1',
        content: [
          {
            type: 'text/html',
            value: 'Test mail -- Local test2'
          }
        ]
      }
      const sendGridRequest = nock('https://api.sendgrid.com')
        .post('/v3/mail/send', expectedSendGridRequest)
        .reply(200, {})
      const responses = await sendgrid.testAction('sendEmail', {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: 'jane'
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          body: 'Test mail -- Local test2',
          subject: 'Test1',
          to: 'test@example.com',
          toName: 'Test User',
          from: 'from@example.com',
          fromName: 'From Name'
        }
      })
      expect(responses.length).toEqual(3)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })
}
