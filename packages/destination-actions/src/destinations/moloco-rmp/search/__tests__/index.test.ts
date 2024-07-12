import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoMCM.search', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        context: {
          page: {
            query: 'Test Query'
          }
        }
      }
    })

    const responses = await testDestination.testAction('search', {
      event,
      settings: {
        platformId: 'foo',
        platformName: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE'
      },
      mapping: {
        timestamp: { '@path': '$.timestamp' },
        search_query: { '@path': '$.properties.context.page.query' }
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should fail to build an event because it misses a required field', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        context: {
          page: {
            query: 'Test Query'
          }
        }
      }
    })

    await expect(
      testDestination.testAction('search', {
        event,
        settings: {
          platformId: 'foo',
          platformName: 'foo',
          apiKey: 'bar',
          channel_type: 'SITE'
        },
        mapping: {
          // searchQuery: {
          //   '@path': '$.properties.context.page.query'
          // } -- missing required field
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })
})
