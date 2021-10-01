import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Signed In', () => {
    it('should handle a basic event', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Signed In',
        userId: 'abc123',
        type: 'track',
        properties: {
          login_method: 'Okta SSO'
        }
      })
      const responses = await testDestination.testAction('login', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          method: {
            '@path': '$.properties.login_method'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
            Headers {
              Symbol(map): Object {
                "content-type": Array [
                  "application/json",
                ],
                "user-agent": Array [
                  "Segment",
                ],
              },
            }
          `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"login\\",\\"params\\":{\\"method\\":\\"Okta SSO\\"}}]}"`
      )
    })
  })
})
