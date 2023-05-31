import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { enchargeIngestAPIBase } from '../../utils'

const testDestination = createTestIntegration(Destination)

const testAPIKey = 'test_api_key'

const dateISOString = '2023-01-01T00:00:00.000Z'
const messageId = '1234'

describe('Encharge.identifyUser', () => {
  test('should handle and transform "track" event', async () => {
    nock(enchargeIngestAPIBase).post(`/v1`).reply(200, {})

    const event = createTestEvent({
      traits: {
        name: 'Johny Bravo'
      },
      type: 'identify',
      messageId,
      receivedAt: dateISOString,
      sentAt: dateISOString,
      timestamp: dateISOString
    })
    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: testAPIKey
      }
    })

    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "campaign": Object {},
          "ip": "8.8.8.8",
          "location": Object {
            "city": "San Francisco",
            "country": "United States",
          },
          "page": Object {
            "path": "/academy/",
            "referrer": "",
            "search": "",
            "title": "Analytics Academy",
            "url": "https://segment.com/academy/",
          },
          "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
        },
        "messageId": "1234",
        "segmentAnonymousId": "anonId1234",
        "timestamp": "2023-01-01T00:00:00.000Z",
        "type": "identify",
        "user": Object {
          "email": undefined,
          "name": "Johny Bravo",
          "segmentAnonymousId": "anonId1234",
          "userId": "user1234",
        },
        "userId": "user1234",
      }
    `)

    expect(responses[0].options.headers).toMatchInlineSnapshot(`
      Headers {
        Symbol(map): Object {
          "content-type": Array [
            "application/json",
          ],
          "user-agent": Array [
            "Segment (Actions)",
          ],
          "x-encharge-token": Array [
            "test_api_key",
          ],
          "x-segment-actions": Array [
            "1",
          ],
        },
      }
    `)
  })
})
