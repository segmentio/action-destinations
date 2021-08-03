import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Signed Up', () => {
    it('should handle a basic event', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Signed Up',
        type: 'track',
        userId: '3456fff',
        properties: {
          type: 'Google'
        }
      })

      const responses = await testDestination.testAction('signUp', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        useDefaultMappings: true
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"sign_up\\",\\"params\\":{\\"method\\":\\"Google\\"}}]}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Signed Up',
        type: 'track',
        anonymousId: '3456fff',
        properties: {
          signup_method: 'Google'
        }
      })
      const responses = await testDestination.testAction('signUp', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          method: {
            '@path': '$.properties.signup_method'
          }
        },
        useDefaultMappings: false
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"sign_up\\",\\"params\\":{\\"method\\":\\"Google\\"}}]}"`
      )
    })
  })
})
