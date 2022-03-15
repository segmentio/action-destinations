import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { customerProfileId } from '../../t1-properties'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerProfile', () => {
  it('request body is missing', async () => {
    try {
      await testDestination.testAction('updateCustomerProfile', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain('Empty request is submitted')
    }
  })

  it('Missed customer profile ID', async () => {
    try {
      await testDestination.testAction('updateCustomerProfile', {
        settings: {
          api_key: 'some_api_key',
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
      expect(err.message).toContain('Not Found')
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put(`/segment/customer_profile/${customerProfileId}`, {
        customerProfileId: '',
        attributes: [],
        audiencesChanges: {
          adds: [],
          deletes: []
        },
        runRuleEngine: true
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfile', {
      settings: {
        api_key: 'some_api_key',
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
  })
})
