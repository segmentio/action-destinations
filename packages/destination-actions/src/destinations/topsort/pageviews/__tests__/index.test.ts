import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Topsort.pageview', () => {
  it('should be successful with default mappings and optional fields', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      context: {
        device: {
          type: 'ios'
        }
      },
      properties: {
        channel: 'onsite',
        page: {
          pageId: 'page-1',
          type: 'category',
          value: 'some page info'
        }
      }
    })

    const responses = await testDestination.testAction('pageviews', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      pageviews: expect.arrayContaining([
        expect.objectContaining({
          deviceType: 'mobile',
          channel: 'onsite',
          id: expect.any(String),
          page: {
            pageId: 'page-1',
            type: 'category',
            value: 'some page info'
          },
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String)
        })
      ])
    })
  })

  it('should fail because it misses a required field (pageId)', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({})

    await expect(
      testDestination.testAction('pageviews', {
        event,
        settings: {
          api_key: 'bar'
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })
})
