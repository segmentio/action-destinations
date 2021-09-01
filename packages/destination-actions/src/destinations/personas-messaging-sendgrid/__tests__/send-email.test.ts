import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Sendgrid from '..'

const sendgrid = createTestIntegration(Sendgrid)
const timestamp = new Date().toISOString()

for (const environment of ['stage', 'production']) {
  const settings = {
    sendGridApiKey: 'sendGridApiKey',
    profileApiEnvironment: environment,
    profileApiAccessToken: 'c',
    spaceId: 'spaceId',
    sourceId: 'sourceId'
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  describe(`${environment} - send Email`, () => {
    it('should send Email', async () => {
      nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:jane`)
        .get('/traits?limit=200')
        .reply(200, {
          traits: {
            firstName: 'First Name',
            lastName: 'Browning'
          }
        })

      nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:jane`)
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
                name: 'First Name Browning'
              }
            ],
            bcc: [
              {
                email: 'test@test.com'
              }
            ],
            custom_args: {
              source_id: 'sourceId',
              space_id: 'spaceId',
              user_id: 'jane'
            }
          }
        ],
        from: {
          email: 'from@example.com',
          name: 'From Name'
        },
        reply_to: {
          email: 'replyto@example.com',
          name: 'Test user'
        },
        subject: 'Hello Browning First Name.',
        content: [
          {
            type: 'text/html',
            value: 'Hi First Name, Welcome to segment'
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
          fromEmail: 'from@example.com',
          fromName: 'From Name',
          replyToEmail: 'replyto@example.com',
          replyToName: 'Test user',
          bcc: JSON.stringify([
            {
              email: 'test@test.com'
            }
          ]),
          previewText: '',
          subject: 'Hello {{profile.traits.lastName}} {{profile.traits.firstName}}.',
          body: 'Hi {{profile.traits.firstName}}, Welcome to segment',
          bodyType: 'html',
          bodyHtml: '<p>Some content</p>'
        }
      })

      expect(responses.length).toEqual(3)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })
}
