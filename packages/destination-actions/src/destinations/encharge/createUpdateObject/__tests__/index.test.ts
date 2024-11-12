import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { enchargeIngestAPIBase } from '../../utils'

const testDestination = createTestIntegration(Destination)

const testAPIKey = 'test_api_key'

const dateISOString = '2023-01-01T00:00:00.000Z'
const messageId = '1234'

describe('Encharge.createUpdateObject', () => {
  test('should handle and transform "track" event', async () => {
    nock(enchargeIngestAPIBase).post(`/v1`).reply(200, {})

    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'test',
        value: '123'
      },
      groupId: 'group1234',
      userId: 'user1234',
      messageId,
      receivedAt: dateISOString,
      sentAt: dateISOString,
      timestamp: dateISOString
    })
    const responses = await testDestination.testAction('createUpdateObject', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: testAPIKey
      }
    })

    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Object {
        "objectType": "company",
        "properties": Object {
          "externalId": "group1234",
          "id": undefined,
          "name": "test",
          "value": "123",
        },
        "type": "group",
        "user": Object {
          "email": undefined,
          "userId": "user1234",
        },
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
