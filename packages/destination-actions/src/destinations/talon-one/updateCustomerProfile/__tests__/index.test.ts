import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('Talon.One - Update Customer Profile', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerProfile', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('misses customer profile ID', async () => {
    try {
      await testDestination.testAction('updateCustomerProfile', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          customerProfileId: '',
          attributes: [],
          audiencesChanges: {
            adds: [],
            deletes: []
          },
          runRuleEngine: true
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put(`/segment/customer_profile/abc123`, {
        attributes: {
          testAttribute1: 'testValue'
        },
        audiencesChanges: {
          adds: [1, 2, 3],
          deletes: [4, 5, 6]
        },
        runRuleEngine: true
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfile', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerProfileId: 'abc123',
        attributes: {
          testAttribute1: 'testValue'
        },
        addAudienceIDs: [1, 2, 3],
        deleteAudienceIDs: [4, 5, 6],
        runRuleEngine: true
      }
    })
  })
})
