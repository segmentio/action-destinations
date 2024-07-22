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
const client_identifier_id = 'delivrai' // References settings.customer_desc
const ADVERTISING_ID = 'foobar' // References device.advertisingId

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

describe('delivrAIAudiences.updateSegment', () => {
  describe('Success cases', () => {
    it('should not throw an error if event includes email', async () => {
      nock(`https://dev.cdpresolution.com`).post('/backend/segment/audience').reply(200)

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
          identifier: 'email'
        },
        useDefaultMappings: true,
        settings: {
          client_identifier_id: client_identifier_id
        }
      })
      
      expect(responses[0].status).toBe(200)
    })
  })
  describe('Failure cases', () => {
    it('should throw an error if event does not include email', async () => {
      nock(`https://dev.cdpresolution.com`).post('/backend/segment/audience/').reply(200, { status: false })

      await expect(
        testDestination.testAction('updateSegment', {
          auth,
          event: bad_event,
          mapping: {
            identifier: 'email'
          },
          useDefaultMappings: true,
          settings: {
            client_identifier_id: client_identifier_id
          }
        })
      ).rejects.toThrow("The root value is missing the required field 'email'")
    })
  })
})
