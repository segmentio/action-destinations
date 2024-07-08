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
    // it('should not throw an error if event includes email', async () => {
    //   nock(`https://dev.cdpresolution.com`).post('/segemnt/audience/').reply(200, { status: false })

    //   const good_event = createTestEvent({
    //     type: 'identify',
    //     traits: {
    //       email: 'testing@testing.com',
    //       sneakers_buyers: true
    //     },
    //     context: {
    //       traits: {
    //         sneakers_buyers: true
    //       },
    //       personas: {
    //         audience_settings: {
    //           audience_id: AUDIENCE_ID,
    //           audience_key: AUDIENCE_KEY
    //         },
    //         computation_id: AUDIENCE_ID,
    //         computation_key: AUDIENCE_KEY,
    //         computation_class: 'audience'
    //       }
    //     }
    //   })

    //   const responses = await testDestination.testAction('updateSegment', {
    //     auth,
    //     event: good_event,
    //     mapping: {
    //       identifier: 'email'
    //     },
    //     useDefaultMappings: true,
    //     settings: {
    //       client_identifier_id: client_identifier_id
    //     },
    //   })

    //   // Then
    //   console.log(responses);
    //   expect(responses.length).toBe(1)
    //   expect(responses[0].status).toBe(200)
    // })
  })

  describe('Failure cases', () => {
    /*
      it('should fail if credentials are incorrect', async () => {
        nock(`https://dev.cdpresolution.com`).post('/segment/audience/').reply(401)
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


    it('should throw an error if event does not include email', async () => {
      nock(`https://dev.cdpresolution.com`).post('/segment/audience/').reply(200, { status: false })

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
