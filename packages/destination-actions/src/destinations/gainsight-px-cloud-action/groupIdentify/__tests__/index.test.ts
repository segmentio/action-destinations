import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const GAINSIGHT_API_KEY = 'testApiKey'
const timestamp = '2021-12-07T15:12:09.334Z'

describe('GainsightPxCloudAction.groupIdentify', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      timestamp,
      groupId: 'test-group-id',
      userId: 'test-user-id',
      traits: { hello: 'world', company: 'Gainsight' },
      context: {
        "ip": "8.8.8.8",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"
      }
    })

    nock('https://segment-esp.aptrinsic.com').post('/rte/segmentio/v1/push').reply(200, {})

    const responses = await testDestination.testAction('groupIdentify', {
      event,
      mapping: {
        allFields: {
          '@path': '$.'
        }
      },
      useDefaultMappings: true,
      settings: {
        apiKey: GAINSIGHT_API_KEY,
        dataCenter: 'north_america'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      allFields: {
        groupId: 'test-group-id',
        userId: 'test-user-id',
        traits: { hello: 'world', company: 'Gainsight' },
      }
    })
  })
})
