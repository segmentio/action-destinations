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
                name: 'Test User'
              }
            ],
            custom_args: {
              user_id: 'jane',
              source_id: '',
              space_id: ''
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
      expect(responses.length).toEqual(1)
      expect(sendGridRequest.isDone()).toEqual(true)
    })
  })
}
