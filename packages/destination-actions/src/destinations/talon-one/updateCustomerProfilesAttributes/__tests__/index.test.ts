import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.updateCustomerProfilesAttributes', () => {
  it('request body is missing', async () => {
    try {
      await testDestination.testAction('updateCustomerProfilesAttributes', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('no data items', async () => {
    try {
      await testDestination.testAction('updateCustomerProfilesAttributes', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://something.europe-west1.talon.one'
        },
        mapping: {
          data: [],
          mutualAttributes: [{ attributeName1: 'value' }, { attributeName2: 'value' }]
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put('/segment/customer_profiles/attributes', {
        data: [
          {
            customerProfileId: 'abc123',
            attributes: {
              attributeName1: 'value',
              attributeName2: 'value'
            }
          }
        ],
        mutualAttributes: {
          attributeName3: 'value'
        }
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader(`destination-hostname`, 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('updateCustomerProfilesAttributes', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerProfileId: 'abc123',
        attributes: {
          attributeName1: 'value',
          attributeName2: 'value'
        },
        mutualAttributes: {
          attributeName3: 'value'
        }
      }
    })
  })
})
