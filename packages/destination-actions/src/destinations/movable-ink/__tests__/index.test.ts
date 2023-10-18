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
      it(`${actionSlug} - should error if no url in settings or payload`, async () => {
        const seedName = `${destinationSlug}#${actionSlug}`
        const action = destination.actions[actionSlug]
        const [eventData] = generateTestData(seedName, destination, action, true)
  
        const event = createTestEvent({
          properties: { 
            ...eventData,
            product_id: 'product_id_1',  // added to ensure a suitable payload for productAdded and productViewed Actions
            products: [
              {product_id: 'product_id_1'} // added to ensure a suitable payload for conversion Action 
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
})
