import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-movable-ink'

const settingsNoMovableInkURL = {
  username: 'test',
  password: 'test'
}

describe('Movable Ink', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      const settings = {
        username: '<test username>',
        password: '<test password>'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('Every Action - ', () => {
    for (const actionSlug in destination.actions) {
      it(`${actionSlug} - Should error if no url in settings AND payload provided`, async () => {
        const seedName = `${destinationSlug}#${actionSlug}`
        const action = destination.actions[actionSlug]
        const [eventData] = generateTestData(seedName, destination, action, true)

        const event = createTestEvent({
          properties: {
            ...eventData,
            product_id: 'product_id_1', // added to ensure a suitable payload for productAdded and productViewed Actions
            products: [
              { product_id: 'product_id_1' } // added to ensure a suitable payload for conversion Action
            ]
          }
        })

        await expect(
          testDestination.testAction(actionSlug, {
            event: event,
            useDefaultMappings: true,
            settings: settingsNoMovableInkURL
          })
        ).rejects.toThrowError('"Movable Ink URL" setting or "Movable Ink URL" field must be populated')
      })
    }
  })

  describe('Every Action - ', () => {
    for (const actionSlug in destination.actions) {
      it(`${actionSlug} should send event if settings url not provided but if properties.url provided`, async () => {
        nock('https://www.test.com').post(/.*/).reply(200)

        const responses = await testDestination.testAction(actionSlug, {
          event: createTestEvent({
            // event payload which will work for any Action
            type: 'track',
            event: 'Custom Event',
            userId: 'user1234',
            anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
            timestamp: '2022-03-30T17:24:58Z',
            properties: {
              movable_ink_url: 'https://www.test.com',
              query: 'transformer toys',
              url: 'https://www.transformertoys.com',
              product_id: '12345',
              products: [{ product_id: '12345' }],
              order_id: 'abcde',
              revenue: 1234,
              categories: [{ id: 'cat1' }]
            }
          }),
          settings: {
            username: '<test username>',
            password: '<test password>'
          },
          mapping: {
            // event mapping which will work for any Action
            event_name: { '@path': '$.event' },
            movable_ink_url: { '@path': '$.properties.movable_ink_url' },
            timestamp: { '@path': '$.timestamp' },
            query: { '@path': '$.properties.query' },
            anonymous_id: { '@path': '$.anonymousId' },
            user_id: { '@path': '$.userId' },
            query_url: { '@path': '$.properties.url' },
            order_id: { '@path': '$.properties.order_id' },
            revenue: { '@path': '$.properties.revenue' },
            product: {
              id: { '@path': '$.properties.product_id' }
            },
            products: {
              '@arrayPath': [
                '$.properties.products',
                {
                  id: { '@path': '$.product_id' }
                }
              ]
            },
            product_with_quantity: {
              id: { '@path': '$.properties.product_id' }
            },
            categories: {
              '@arrayPath': ['$.properties.categories', { id: { '@path': '$.id' } }]
            },
            method: 'POST'
          },
          useDefaultMappings: false
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })
    }
  })
})
