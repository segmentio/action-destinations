import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerProfilesAudiences', () => {
  it('request body is missing', async () => {
    try {
      await testDestination.testAction('updateAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain('Empty request is submitted')
    }
  })

  it('customer profile ID is missing', async () => {
    try {
      await testDestination.testAction('updateAudience', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          data: [
            {
              customerProfileId: '',
              adds: [1, 2, 3],
              deletes: [4, 5, 6]
            }
          ]
        }
      })
    } catch (err) {
      expect(err.message).toContain('Empty Customer Profile ID')
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/audiences', {
        data: [
          {
            customerProfileId: 'abc123',
            adds: [1, 2, 3],
            deletes: [4, 5, 6]
          }
        ]
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateAudience', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        data: [
          {
            customerProfileId: 'abc123',
            adds: [1, 2, 3],
            deletes: [4, 5, 6]
          }
        ]
      }
    })
  })
})
