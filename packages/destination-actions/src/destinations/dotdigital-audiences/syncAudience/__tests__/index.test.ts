import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Dotdigital Audiences - Sync Audience', () => {
  describe('Add to audience (PATCH)', () => {
    it('should add contact to audience with email identifier', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])

      nock(settings.api_host)
        .patch('/contacts/v3/email/test@example.com')
        .reply(200, {
          contactId: 123,
          identifiers: { email: 'test@example.com' }
        })

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        traits: {
          email: 'test@example.com',
          test_audience: true
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        emailIdentifier: 'test@example.com',
        traits_or_props: {
          test_audience: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })

    it('should add contact to audience with mobile number identifier', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])

      nock(settings.api_host)
        .patch('/contacts/v3/mobileNumber/+1234567890')
        .reply(200, {
          contactId: 456,
          identifiers: { mobileNumber: '+1234567890' }
        })

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            phone: '+1234567890'
          }
        },
        traits: {
          phone: '+1234567890',
          test_audience: true
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        mobileNumberIdentifier: '+1234567890',
        traits_or_props: {
          test_audience: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })

    it('should add contact to audience with both email and mobile number identifiers', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])

      nock(settings.api_host)
        .patch('/contacts/v3/email/test@example.com')
        .reply(200, {
          contactId: 789,
          identifiers: {
            email: 'test@example.com',
            mobileNumber: '+1234567890'
          }
        })

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            email: 'test@example.com',
            phone: '+1234567890'
          }
        },
        traits: {
          email: 'test@example.com',
          phone: '+1234567890',
          test_audience: true
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        emailIdentifier: 'test@example.com',
        mobileNumberIdentifier: '+1234567890',
        traits_or_props: {
          test_audience: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })

    it('should add contact to audience with custom data fields', async () => {
      nock(settings.api_host)
        .get('/v2/data-fields/')
        .reply(200, [
          { name: 'FIRSTNAME', type: 'String' },
          { name: 'LASTNAME', type: 'String' },
          { name: 'AGE', type: 'Numeric' }
        ])

      nock(settings.api_host)
        .patch('/contacts/v3/email/test@example.com')
        .reply(200, {
          contactId: 123,
          identifiers: { email: 'test@example.com' },
          dataFields: {
            FIRSTNAME: 'John',
            LASTNAME: 'Doe',
            AGE: 30
          }
        })

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        traits: {
          email: 'test@example.com',
          test_audience: true,
          firstName: 'John',
          lastName: 'Doe',
          age: 30
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        emailIdentifier: 'test@example.com',
        traits_or_props: {
          test_audience: true
        },
        dataFields: {
          FIRSTNAME: 'John',
          LASTNAME: 'Doe',
          AGE: 30
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('Remove from audience (DELETE)', () => {
    it('should remove contact from audience with email identifier', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])

      nock(settings.api_host).delete('/contacts/v3/email/test@example.com').reply(204)

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        traits: {
          email: 'test@example.com',
          test_audience: false
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        emailIdentifier: 'test@example.com',
        traits_or_props: {
          test_audience: false
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })

    it('should remove contact from audience with mobile number identifier', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])

      nock(settings.api_host).delete('/contacts/v3/mobileNumber/+1234567890').reply(204)

      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          },
          traits: {
            phone: '+1234567890'
          }
        },
        traits: {
          phone: '+1234567890',
          test_audience: false
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        mobileNumberIdentifier: '+1234567890',
        traits_or_props: {
          test_audience: false
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('Validation errors', () => {
    it('should throw error when no identifier is provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: '123456'
          }
        },
        traits: {
          test_audience: true
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: '123456',
        traits_or_props: {
          test_audience: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).rejects.toThrowError('At least one identifier (email or mobile number) must be provided.')
    })

    it('should throw error when external_audience_id is not numeric', async () => {
      const event = createTestEvent({
        type: 'identify',
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: 'test_audience',
            external_audience_id: 'invalid-id'
          },
          traits: {
            email: 'test@example.com'
          }
        },
        traits: {
          email: 'test@example.com',
          test_audience: true
        }
      })

      const mapping = {
        segment_computation_action: 'audience',
        computation_key: 'test_audience',
        external_audience_id: 'invalid-id',
        emailIdentifier: 'test@example.com',
        traits_or_props: {
          test_audience: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).rejects.toThrowError('external_audience_id must be a numeric value.')
    })
  })

  describe('Journey step support', () => {
    it('should add contact to audience for journey_step computation class', async () => {
      nock(settings.api_host).get('/v2/data-fields/').reply(200, [])
      nock(settings.api_host)
        .patch('/contacts/v3/email/test@example.com')
        .reply(200, {
          contactId: 123,
          identifiers: { email: 'test@example.com' }
        })

      const event = createTestEvent({
        type: 'track',
        context: {
          personas: {
            computation_class: 'journey_step',
            computation_key: 'test_journey_step',
            external_audience_id: '123456'
          }
        },
        properties: {
          email: 'test@example.com',
          test_journey_step: true
        }
      })

      const mapping = {
        segment_computation_action: 'journey_step',
        computation_key: 'test_journey_step',
        external_audience_id: '123456',
        emailIdentifier: 'test@example.com',
        traits_or_props: {
          test_journey_step: true
        },
        enable_batching: false
      }

      await expect(
        testDestination.testAction('syncAudience', {
          event,
          mapping,
          settings
        })
      ).resolves.not.toThrowError()
    })
  })
})
