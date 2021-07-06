import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Page View', () => {
    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Page View',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          custom_url: 'http://www.example.com/pageOne',
          title: 'Analytics Academy',
          url: 'http://www.example.com/pageOne'
        },
        context: {
          page: {
            path: '/pageOne',
            referrer: 'https://segment.com/academy/',
            search: '',
            title: 'Analytics Academy',
            url: 'http://www.example.com/home'
          }
        }
      })
      const responses = await testDestination.testAction('pageView', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          page_location: {
            '@path': '$.properties.custom_url'
          }
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"page_view\\",\\"params\\":{\\"page_location\\":\\"http://www.example.com/pageOne\\",\\"page_referrer\\":\\"https://segment.com/academy/\\"}}]}"`
      )
    })

    it('should handle default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Page View',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          custom_url: 'http://www.example.com/pageOne',
          title: 'Analytics Academy',
          url: 'http://www.example.com/pageOne'
        },
        context: {
          page: {
            path: '/pageOne',
            referrer: 'https://segment.com/academy/',
            search: '',
            title: 'Analytics Academy',
            url: 'http://www.example.com/home'
          }
        }
      })
      const responses = await testDestination.testAction('pageView', {
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"page_view\\",\\"params\\":{\\"page_location\\":\\"http://www.example.com/home\\",\\"page_referrer\\":\\"https://segment.com/academy/\\"}}]}"`
      )
    })
  })
})
