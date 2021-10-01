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

  const userData = {
    userId: 'jane',
    firstName: 'First Name',
    lastName: 'Browning',
    phone: '+11235554657',
    email: 'test@example.com'
  }

  const endpoint = `https://profiles.segment.${environment === 'production' ? 'com' : 'build'}`

  beforeEach(() => {
    nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:${userData.userId}`)
      .get('/traits?limit=200')
      .reply(200, {
        traits: {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      })

    nock(`${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:${userData.userId}`)
      .get('/external_ids?limit=25')
      .reply(200, {
        data: [
          {
            type: 'user_id',
            id: userData.userId
          },
          {
            type: 'phone',
            id: userData.phone
          },
          {
            type: 'email',
            id: userData.email
          }
        ]
      })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe(`${environment} - send Email`, () => {
    it('should send Email', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
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
              user_id: userData.userId
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
        subject: `Hello ${userData.lastName} ${userData.firstName}.`,
        content: [
          {
            type: 'text/html',
            value: `Hi ${userData.firstName}, Welcome to segment`
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
          userId: userData.userId
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromDomain: null,
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
          bodyHtml: 'Hi {{profile.traits.firstName}}, Welcome to segment',
          send: true
        }
      })

      expect(responses.length).toEqual(3)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
    it('should not send Email', async () => {
      const responses = await sendgrid.testAction('sendEmail', {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromDomain: null,
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
          bodyHtml: 'Hi {{profile.traits.firstName}}, Welcome to segment',
          send: false
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should not send Email when send field in not sent', async () => {
      const responses = await sendgrid.testAction('sendEmail', {
        event: createTestEvent({
          timestamp,
          event: 'Audience Entered',
          userId: userData.userId
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromDomain: null,
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
          bodyHtml: 'Hi {{profile.traits.firstName}}, Welcome to segment'
        }
      })

      expect(responses.length).toEqual(0)
    })

    it('should send email with journey metadata', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: userData.email,
                name: `${userData.firstName} ${userData.lastName}`
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
              user_id: userData.userId,
              journey_id: 'journeyId',
              journey_state_id: 'journeyStateId',
              audience_id: 'audienceId'
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
        subject: 'Test email with metadata',
        content: [
          {
            type: 'text/html',
            value: 'Welcome to segment'
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
          userId: userData.userId
        }),
        settings,
        mapping: {
          userId: { '@path': '$.userId' },
          fromDomain: null,
          fromEmail: 'from@example.com',
          fromName: 'From Name',
          replyToEmail: 'replyto@example.com',
          replyToName: 'Test user',
          bcc: JSON.stringify([
            {
              email: 'test@test.com'
            }
          ]),
          customArgs: {
            journey_id: 'journeyId',
            journey_state_id: 'journeyStateId',
            audience_id: 'audienceId'
          },
          previewText: '',
          subject: 'Test email with metadata',
          body: 'Welcome to segment',
          bodyType: 'html',
          bodyHtml: 'Welcome to segment',
          send: true
        }
      })

      expect(responses.map((r) => r.url)).toStrictEqual([
        `${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:jane/traits?limit=200`,
        `${endpoint}/v1/spaces/spaceId/collections/users/profiles/user_id:jane/external_ids?limit=25`,
        `https://api.sendgrid.com/v3/mail/send`
      ])
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })
}
