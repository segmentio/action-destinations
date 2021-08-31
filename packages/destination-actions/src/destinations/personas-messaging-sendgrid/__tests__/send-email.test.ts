import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Sendgrid from '..'

const sendgrid = createTestIntegration(Sendgrid)
const timestamp = new Date().toISOString()

for (const environment of ['stage', 'production']) {
  const settings = {
    sendGridApiKey: 'sendGridApiKey'
  }

  describe(`${environment} - send Email`, () => {
    it('should send Email', async () => {
      const expectedSendGridRequest = {
        personalizations: [
          {
            to: [
              {
                email: 'test@example.com',
                name: 'First Name Browning'
              }
            ],
            bcc: [],
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
          body: 'Hi {{firstName}}, Welcome to segment',
          subject: 'Hello {{lastName}} {{firstName}}.',
          fromEmail: 'from@example.com',
          fromName: 'From Name',
          spaceId: 'spaceId',
          sourceId: 'sourceId',
          bodyHtml: '<p>Some content</p>',
          replyToEmail: 'replyto@example.com',
          replyToName: 'Test user',
          bodyType: 'html',
          profile: {
            firstName: 'First Name',
            lastName: 'Browning',
            email: 'test@example.com'
          }
        }
      })
      expect(responses.length).toEqual(1)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })
}
