import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'categoryView'

const settings: Settings = {
  movable_ink_url: 'https://www.test.com',
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Category Viewed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    categories: [{ id: 'cat2' }]
  }
})

const eventNoCategory = createTestEvent({
  type: 'track',
  event: 'Category Viewed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {}
})

describe('MovableInk.categoryView', () => {
  it('should send event to Movable Ink if properties.categories.$.id provided', async () => {
    nock(settings.movable_ink_url as string)
      .post(/.*/)
      .reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      event_name: 'Category View',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      categories: [{ id: 'cat2' }]
    })
  })

  it('should throw an error if no properties.categories.$.id in payload', async () => {
    await expect(
      testDestination.testAction(actionSlug, {
        event: eventNoCategory,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'categories'.")
  })
})
