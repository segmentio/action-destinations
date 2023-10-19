import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'search'
const settings: Settings = {
    movable_ink_url: 'https://www.test.com',
    username: 'test',
    password: 'test'
}

const settingsNoMovableInkURL: Settings = {
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Search',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    query: 'transformer toys',
    url: 'https://www.transformertoys.com'
  }
})

const eventNoQuery = createTestEvent({
  type: 'track',
  event: 'Search',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    url: 'https://www.transformertoys.com'
  }
})

describe('MovableInk.search', () => {
  it('should send search event to Movable Ink if properties.query provided', async () => {
    nock(settings.movable_ink_url as string).post(/.*/).reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(
      {
        event_name: 'Search',
        user_id: 'user1234', 
        anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b', 
        timestamp: '2022-03-30T17:24:58Z',
        query: 'transformer toys',
        url: 'https://www.transformertoys.com'
      }
    )
  })

  it('should send search event to Movable Ink if settings url not provided but if properties.url provided', async () => {
    nock(settings.movable_ink_url as string).post(/.*/).reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event: {
        ...event, 
        properties: {
          ...event.properties, 
          movable_ink_url: 'https://www.test.com'
        }
      },
      settings: settingsNoMovableInkURL,
      mapping: {
        movable_ink_url: { '@path': '$.properties.movable_ink_url'},
        timestamp:  { '@path': '$.timestamp'},
        query: { '@path': '$.properties.query' },
        anonymous_id: { '@path': '$.anonymousId' },
        user_id: { '@path': '$.userId' },
        query_url: { '@path': '$.properties.url' }
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(
      {
        event_name: 'Search',
        user_id: 'user1234', 
        anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b', 
        timestamp: '2022-03-30T17:24:58Z',
        query: 'transformer toys',
        url: 'https://www.transformertoys.com'
      }
    )
  })

  it('should throw an error if no query in payload', async () => {
    await expect(
      testDestination.testAction('search', {
        event: eventNoQuery,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'query'.")
  })

})


