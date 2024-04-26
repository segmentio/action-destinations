import nock from 'nock'
import { createTestEvent, createTestIntegration, DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const pixelToken = '123abc'

describe('Magellan AI', () => {
  describe('onDelete', () => {
    it('does nothing if no apiToken is provided', async () => {
      if (testDestination.onDelete) {
        const event = createTestEvent()
        const settings = { pixelToken }
        await expect(testDestination.onDelete(event, settings)).resolves.not.toThrowError()
      } else {
        fail('onDelete not implemented')
      }
    })

    it('sends an authorized deletion request to the Magellan API if an apiToken is provided', async () => {
      if (testDestination.onDelete) {
        const event = createTestEvent()
        const { userId, anonymousId } = event
        const settings = {
          pixelToken,
          apiToken: 'foo-bar-123-abc'
        }
        nock('https://api.magellan.ai')
          .post('/v2/gdpr/delete', { userId, anonymousId, pixelToken })
          .matchHeader('authorization', `Bearer ${settings.apiToken}`)
          .reply(200, {})

        const result = await testDestination.onDelete(event, settings)
        const response = result as DecoratedResponse
        expect(response.status).toBe(200)
      } else {
        fail('onDelete not implemented')
      }
    })
  })
})
