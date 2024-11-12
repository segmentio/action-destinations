import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'track'
const destinationSlug = 'actions-apolloio'

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user1234',
      timestamp: '2023-07-29T00:00:00.000Z',
      context: {
        page: {
          search: 'search_query'
        },
        ip: '111.222.333.444'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      useDefaultMappings: true,
      settings: {
        apiToken: 'test'
      },
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user1234',
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2023-07-29T00:00:00.000Z',
      properties: {
        product_id: 'pid_1'
      },
      context: {
        page: {
          search: 'search_query'
        },
        ip: '111.222.333.444',
        campaign: {
          name: 'campaign_name',
          term: 'campaign_term',
          source: 'campaign_source',
          medium: 'campaign_medium',
          content: 'campaign_content'
        }
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      useDefaultMappings: true,
      settings: {
        apiToken: 'test'
      },
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
