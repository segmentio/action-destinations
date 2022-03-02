import { createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)

describe('TalonOne.trackEvent', () => {
  it('customer_profile_id is missing', async () => {
    try {
      await testDestination.testAction('trackEvent', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'customer_profile_id'.")
    }
  })

  it('event_type is missing', async () => {
    try {
      await testDestination.testAction('trackEvent', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        },
        mapping: {
          customer_profile_id: 'some_customer_profile_id'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'event_type'.")
    }
  })

  it('type is missing', async () => {
    try {
      await testDestination.testAction('trackEvent', {
        settings: {
          api_key: 'some_api_key',
          deployment: 'https://internal.europe-west1.talon.one'
        },
        mapping: {
          customer_profile_id: 'some_customer_profile_id',
          event_type: 'event_type'
        }
      })
    } catch (err) {
      expect(err.message).toContain("missing the required field 'type'.")
    }
  })

  it('should work', async () => {
    nock('https://integration.talon.one')
      .put('/segment/event', {
        customer_profile_id: 'some_customer_profile_id',
        event_type: 'event_type',
        type: 'string'
      })
      .matchHeader('Authorization', 'ApiKey-v1 some_api_key')
      .matchHeader('destination-hostname', 'https://something.europe-west1.talon.one')
      .reply(200)

    await testDestination.testAction('trackEvent', {
      settings: {
        api_key: 'some_api_key',
        deployment: 'https://something.europe-west1.talon.one'
      },
      mapping: {
        customer_profile_id: 'some_customer_profile_id',
        event_type: 'event_type',
        type: 'string'
      }
    })
  })
})
