import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('Talon.One - Update Customer Profiles Audiences', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerProfilesAudiences', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'data'.")
    }
  })

  it('misses customer profile ID', async () => {
    try {
      await testDestination.testAction('updateCustomerProfilesAudiences', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          data: [
            {
              adds: [1, 2, 3],
              deletes: [4, 5, 6]
            }
          ]
        }
      })
    } catch (err) {
      expect(err.message).toContain("The value at /data/0 is missing the required field 'customerProfileId'.")
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
          },
          {
            customerProfileId: 'def456',
            adds: [5, 6, 7],
            deletes: [8, 9, 10]
          }
        ]
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfilesAudiences', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        data: [
          {
            customerProfileId: 'abc123',
            adds: [1, 2, 3],
            deletes: [4, 5, 6]
          },
          {
            customerProfileId: 'def456',
            adds: [5, 6, 7],
            deletes: [8, 9, 10]
          }
        ]
      }
    })
  })
})
