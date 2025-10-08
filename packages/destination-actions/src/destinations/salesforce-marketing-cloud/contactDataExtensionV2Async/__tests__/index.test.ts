import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('SalesforceMarketingCloud.contactDataExtensionV2Async', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('perform', () => {
    it('should throw error when perform method is called directly', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        traits: {
          email: 'test@example.com'
        }
      })

      await expect(
        testDestination.testAction('contactDataExtensionV2Async', {
          event,
          mapping: {
            keys: {
              contactKey: 'user-123'
            },
            values: {
              email: 'test@example.com'
            }
          },
          settings: {
            subdomain: 'mc123456789',
            client_id: 'client_id_123',
            client_secret: 'client_secret_123',
            account_id: 'account_id_123'
          }
        })
      ).rejects.toThrowError('This action only supports batch operations')
    })
  })
})
