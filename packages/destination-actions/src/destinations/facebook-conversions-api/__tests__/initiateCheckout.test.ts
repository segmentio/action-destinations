import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  token: process.env.TOKEN
}
describe.skip('FacebookConversionsApi', () => {
  describe('InitiateCheckout', () => {
    it('should handle basic mapping overrides')

    it('should throw an error for invalid currency values')

    it('should handle default mappings')

    it('should handle events with no provided properties')

    it('should throw an error if no user_data keys are included', async () => {
      nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
        .post(`/events?access_token=${process.env.TOKEN}`)
        .reply(201, {})
  
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068', // Pre -hashed for simplicity
        timestamp: '1631210063',
        properties: {
          action_source: 'email',
          currency: 'USD',
          value: 12.12
        }
      })
  
      await expect(testDestination.testAction('initiateCheckout', {
        event,
        settings,
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          }
          // No user data mapping included. This should cause action to fail.
        }
      })).rejects.toThrowError('Must include at least one user data property')
    })
  })
})
