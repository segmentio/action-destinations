import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerProfileV2', () => {
  it('misses request body', async () => {
    try {
      await testDestination.testAction('updateCustomerProfileV2', {
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
      await testDestination.testAction('updateCustomerProfileV2', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          customerProfileId: '',
          audiencesToAdd: [],
          audiencesToDelete: [],
          runRuleEngine: true,
          attributes: [],
          attributesInfo: []
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put(`/segment/customer_profile_v2/abc123`, {
        audiencesChanges: {
          adds: [
            {
              name: 'testAudience1',
              integrationId: 'testAudience1IntegrationId'
            },
            {
              name: 'testAudience2',
              integrationId: 'testAudience2IntegrationId'
            }
          ],
          deletes: [
            {
              name: 'testAudience3',
              integrationId: 'testAudience3IntegrationId'
            },
            {
              name: 'testAudience4',
              integrationId: 'testAudience4IntegrationId'
            }
          ]
        },
        runRuleEngine: true,
        attributes: {
          testAttribute1: 'testValue1',
          testAttribute2: 'testValue2'
        },
        attributesInfo: [
          {
            name: 'testAttribute1',
            type: 'string'
          },
          {
            name: 'testAttribute2',
            type: 'string'
          }
        ]
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfileV2', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerProfileId: 'abc123',
        audiencesToAdd: [
          {
            name: 'testAudience1',
            integrationId: 'testAudience1IntegrationId'
          },
          {
            name: 'testAudience2',
            integrationId: 'testAudience2IntegrationId'
          }
        ],
        audiencesToDelete: [
          {
            name: 'testAudience3',
            integrationId: 'testAudience3IntegrationId'
          },
          {
            name: 'testAudience4',
            integrationId: 'testAudience4IntegrationId'
          }
        ],
        runRuleEngine: true,
        attributes: {
          testAttribute1: 'testValue1',
          testAttribute2: 'testValue2'
        },
        attributesInfo: [
          {
            name: 'testAttribute1',
            type: 'string'
          },
          {
            name: 'testAttribute2',
            type: 'string'
          }
        ]
      }
    })
  })
})
