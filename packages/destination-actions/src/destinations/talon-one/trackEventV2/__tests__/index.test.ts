import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.trackEventV2', () => {
  it('misses customer profile ID', async () => {
    try {
      await testDestination.testAction('trackEventV2', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'customerProfileId'.")
    }
  })

  it('misses event type', async () => {
    try {
      await testDestination.testAction('trackEvenV2', {
        settings: {
          apiKey: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        },
        mapping: {
          customerProfileId: 'some_customer_profile_id'
        }
      })
    } catch (err) {
      expect(err.message).toContain("The root value is missing the required field 'eventType'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put('/segment/v2/events?skipNonExistingAttributes=true', {
        customerProfileId: 'some_customer_profile_id',
        eventType: 'event_type',
        eventAttributes: {
          favoriteProduct: 'fruits',
          isDogLover: true,
          stringAttribute: 'test',
          booleanAttribute: 'true',
          numberAttribute: '12345'
        }
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('trackEventV2', {
      settings: {
        apiKey: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customerProfileId: 'some_customer_profile_id',
        skipNonExistingAttributes: true,
        eventType: 'event_type',
        attributes: {
          favoriteProduct: 'fruits',
          isDogLover: true,
          stringAttribute: 'test',
          booleanAttribute: 'true',
          numberAttribute: '12345'
        }
      }
    })
  })
})
