import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Twilio from '../index'

const testDestination = createTestIntegration(Twilio)
const timestamp = new Date().toISOString()
const accountId = '_account_'

describe('Twilio', () => {
  describe('sendSMS', () => {
    it('should work with default mappings', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          To: '+17758638863',
          Body: 'Hello, World!',
          MediaUrl: 'https://demo.twilio.com/owl.png'
        }
      })

      nock(`https://api.twilio.com/2010-04-01/Accounts/${accountId}`).post('/Messages.json').reply(201, {})

      const responses = await testDestination.testAction('sendSMS', {
        event,
        settings: {
          accountId,
          phoneNumber: '+12056065576',
          token: '_token_'
        },
        mapping: {
          To: {
            '@path': '$.properties.To'
          },
          Body: {
            '@path': '$.properties.Body'
          },
          MediaUrl: {
            '@path': '$.properties.MediaUrl'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body.toString()).toMatchInlineSnapshot(
        `"From=%2B12056065576&To=%2B17758638863&Body=Hello%2C+World%21&MediaUrl=https%3A%2F%2Fdemo.twilio.com%2Fowl.png"`
      )

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "Content-Type": Array [
              "application/x-www-form-urlencoded;charset=UTF-8",
            ],
            "authorization": Array [
              "Basic X2FjY291bnRfOl90b2tlbl8=",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.username).toMatchInlineSnapshot(`"_account_"`)
      expect(responses[0].options.password).toMatchInlineSnapshot(`"_token_"`)
    })
  })
})
