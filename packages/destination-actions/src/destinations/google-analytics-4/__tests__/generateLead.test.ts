import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Generate Lead', () => {
    it('should test handle a basic event', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track',
        properties: {
          currency: 'USD',
          value: '300'
        }
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
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
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"value\\":300}}]}"`
      )
    })

    it('should throw an error when a value is included with no currency', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track',
        properties: {
          value: 42
        }
      })
      try {
        await testDestination.testAction('generateLead', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            value: {
              '@path': '$.properties.value'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Currency is required if value is set.')
      }
    })

    it('should handle an empty properties body', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Lead Generated',
        userId: 'abc123',
        type: 'track'
      })
      const responses = await testDestination.testAction('generateLead', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.userId'
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
        `"{\\"client_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"generate_lead\\",\\"params\\":{}}]}"`
      )
    })
  })
})
