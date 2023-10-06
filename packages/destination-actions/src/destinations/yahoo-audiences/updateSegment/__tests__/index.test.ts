import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const auth: AuthTokens = {
  accessToken: 'test',
  refreshToken: ''
}

const AUDIENCE_ID = 'aud_12345' // References audienceSettings.audience_id
const AUDIENCE_KEY = 'sneakers_buyers' // References audienceSettings.audience_key
const ADVERTISING_ID = 'foobar' // References device.advertisingId
const ENGAGE_SPACE_ID = 'acme_corp_engage_space' // References settings.engage_space_id
const MDM_ID = 'mdm 123' // References settings.mdm_id
const CUST_DESC = 'ACME Corp' // References settings.customer_desc

const bad_event = createTestEvent({
  type: 'identify',
  traits: {
    sneakers_buyers: true
  },
  context: {
    traits: {
      sneakers_buyers: true
    },
    personas: {
      audience_settings: {
        audience_id: AUDIENCE_ID,
        audience_key: AUDIENCE_KEY
      },
      computation_id: AUDIENCE_ID,
      computation_key: AUDIENCE_KEY,
      computation_class: 'audience'
    }
  }
})

describe('YahooAudiences.updateSegment', () => {
  describe('Success cases', () => {
    it('should not throw an error if event includes email / maid', async () => {
      nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(200)

      const good_event = createTestEvent({
        type: 'identify',
        context: {
          device: {
            advertisingId: ADVERTISING_ID
          },
          personas: {
            audience_settings: {
              audience_id: AUDIENCE_ID,
              audience_key: AUDIENCE_KEY
            },
            computation_id: AUDIENCE_ID,
            computation_key: AUDIENCE_KEY,
            computation_class: 'audience'
          }
        },
        traits: {
          email: 'testing@testing.com',
          sneakers_buyers: true
        }
      })

      const responses = await testDestination.testAction('updateSegment', {
        auth,
        event: good_event,
        mapping: {
          identifier: 'email_maid'
        },
        useDefaultMappings: true,
        settings: {
          engage_space_id: ENGAGE_SPACE_ID,
          mdm_id: MDM_ID,
          customer_desc: CUST_DESC
        }
      })

      // Then
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })

  describe('Failure cases', () => {
    /*
      it('should fail if credentials are incorrect', async () => {
        nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(401)
        const response = await testDestination.testAction('updateSegment', {
          event: good_event,
          mapping: {},
          useDefaultMappings: true,
          settings: {
            engage_space_id: '123',
            mdm_id: '234',
            taxonomy_client_key: '345',
            taxonomy_client_secret: '456',
            customer_desc: 'Spacely Sprockets'
          }
        })

        // Then
        expect(response).toHaveLength(1)
        expect(response[0].status).toBe(401)
      })
      */
    it('should throw an error if audience event missing mandatory "computation_class" field', async () => {
      const bad_event = createTestEvent({
        type: 'identify',
        traits: {
          sneakers_buyers: true
        },
        context: {
          traits: {
            sneakers_buyers: true,
            email: 'joe@doe.com'
          },
          personas: {
            audience_settings: {
              audience_id: AUDIENCE_ID,
              audience_key: AUDIENCE_KEY
            },
            computation_id: AUDIENCE_ID,
            computation_key: AUDIENCE_KEY
          }
        }
      })
      await expect(
        testDestination.testAction('updateSegment', {
          event: bad_event,
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
    })

    it('should throw an error if audience key does not match traits object', async () => {
      const bad_event = createTestEvent({
        type: 'identify',
        traits: {
          sneakers_buyers: true,
          email: 'joe@doe.com'
        },
        context: {
          personas: {
            audience_settings: {
              audience_id: AUDIENCE_ID,
              audience_key: AUDIENCE_KEY
            },
            computation_id: AUDIENCE_ID,
            computation_key: 'incorrect_audience_key',
            computation_class: 'audience'
          }
        }
      })

      nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(400)

      await expect(
        testDestination.testAction('syncAudience', {
          event: bad_event,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should throw an error if event does not include email / maid', async () => {
      nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(400)

      await expect(
        testDestination.testAction('updateSegment', {
          auth,
          event: bad_event,
          mapping: {
            identifier: 'email_maid'
          },
          useDefaultMappings: true,
          settings: {
            engage_space_id: ENGAGE_SPACE_ID,
            mdm_id: MDM_ID,
            customer_desc: CUST_DESC
          }
        })
      ).rejects.toThrow('Email and / or Advertising Id not available in the profile(s)')
    })
  })
})
