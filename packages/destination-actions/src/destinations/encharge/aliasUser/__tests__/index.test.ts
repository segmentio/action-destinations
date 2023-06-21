import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { enchargeIngestAPIBase } from '../../utils'

const testDestination = createTestIntegration(Destination)

const testAPIKey = 'test_api_key'

const dateISOString = '2023-01-01T00:00:00.000Z'
const messageId = '1234'

describe('Encharge.aliasUser', () => {
  test('should handle and transform "track" event', async () => {
    nock(enchargeIngestAPIBase).post(`/v1`).reply(200, {})

    const event = createTestEvent({
      type: 'alias',
      previousId: 'previous',
      messageId,
      receivedAt: dateISOString,
      sentAt: dateISOString,
      timestamp: dateISOString
    })
    const responses = await testDestination.testAction('aliasUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: testAPIKey
      }
    })

    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Object {
        "messageId": "1234",
        "previousUserId": "previous",
        "timestamp": "2023-01-01T00:00:00.000Z",
        "type": "alias",
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
