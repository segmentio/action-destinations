import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerProfileV3', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerProfileV3', {
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
      await testDestination.testAction('updateCustomerProfileV3', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          customerProfileId: '',
          addAudienceIds: [],
          deleteAudienceIds: [],
          runRuleEngine: true,
          attributes: []
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put(`/segment/v2/customer_profiles/abc123?skipNonExistingAttributes=true`, {
        audiencesChanges: {
          adds: [1, 2, 3],
          deletes: [4, 5, 6]
        },
        runRuleEngine: true,
        attributes: {
          testAttribute1: 'testValue1',
          testAttribute2: 'testValue2'
        }
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfileV3', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerProfileId: 'abc123',
        addAudienceIds: [1, 2, 3],
        deleteAudienceIds: [4, 5, 6],
        runRuleEngine: true,
        attributes: {
          testAttribute1: 'testValue1',
          testAttribute2: 'testValue2'
        },
        skipNonExistingAttributes: true
      }
    })
  })
})
