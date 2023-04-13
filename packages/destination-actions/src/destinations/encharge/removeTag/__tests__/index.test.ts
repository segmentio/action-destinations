import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { enchargeRestAPIBase } from '../../utils'
import { PayloadValidationError } from '@segment/actions-core'

const testDestination = createTestIntegration(Definition)

const messageId = '1234'
const dateISOString = '2023-01-01T00:00:00.000Z'
const testAPIKey = 'test_api_key'

describe('Encharge Untag User', () => {
  it('should untag an user', async () => {
    nock(enchargeRestAPIBase).delete('/v1/tags').reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      traits: {
        tag: 'tag1'
      },
      userId: 'user1234',
      messageId,
      receivedAt: dateISOString,
      sentAt: dateISOString,
      timestamp: dateISOString
    })
    const responses = await testDestination.testAction('removeTag', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: testAPIKey
      }
    })

    expect(responses[0].options.json).toMatchInlineSnapshot(`
      Object {
        "segmentAnonymousId": "anonId1234",
        "tag": "tag1",
        "userId": "user1234",
      }
    `)
  })

  it('should not delete if no IDs', async () => {
    // expect to throw PayloadValidationError
    const event = createTestEvent({
      type: 'identify',
      traits: {
        tag: 'tag1'
      },
      userId: undefined,
      anonymousId: undefined,
      messageId,
      receivedAt: dateISOString,
      sentAt: dateISOString,
      timestamp: dateISOString
    })

    await expect(
      testDestination.testAction('removeTag', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: testAPIKey
        }
      })
    ).rejects.toThrow(PayloadValidationError)
  })
})
