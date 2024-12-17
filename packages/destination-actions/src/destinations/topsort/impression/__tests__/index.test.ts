import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Topsort.impression', () => {
  it('should be successful with default mappings and resolvedBidId', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        resolvedBidId: 'thisisaresolvedbidid'
      }
    })

    const responses = await testDestination.testAction('impression', {
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
      impressions: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          resolvedBidId: 'thisisaresolvedbidid',
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String)
        })
      ])
    })
  })

  it('should be successful with additional attribution', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        additionalAttribution: { id: '123', type: 'user' },
        resolvedBidId: 'thisisaresolvedbidid'
      }
    })

    const responses = await testDestination.testAction('impression', {
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
      impressions: expect.arrayContaining([
        expect.objectContaining({
          additionalAttribution: { id: '123', type: 'user' }
        })
      ])
    })
  })

  it('should fail because it misses a required field (resolvedBidId)', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({})

    await expect(
      testDestination.testAction('impression', {
        event,
        settings: {
          api_key: 'bar'
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })
})
