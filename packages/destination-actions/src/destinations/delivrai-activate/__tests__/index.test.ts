// import nock from 'nock'
// import { IntegrationError, createTestIntegration } from '@segment/actions-core'

// import Destination from '../index'
import { gen_update_segment_payload } from '../utils-rt'
import { Payload } from '../updateSegment/generated-types'

// const AUDIENCE_ID = 'aud_123456789012345678901234567' // References audienceSettings.audience_id
// const AUDIENCE_KEY = 'sneakers_buyers' // References audienceSettings.audience_key
// const ENGAGE_SPACE_ID = 'acme_corp_engage_space' // References settings.engage_space_id
// const MDM_ID = 'mdm 123' // References settings.mdm_id
// const CUST_DESC = 'ACME Corp' // References settings.customer_desc

// const createAudienceInput = {
//   settings: {
//     engage_space_id: ENGAGE_SPACE_ID,
//     mdm_id: MDM_ID,
//     customer_desc: CUST_DESC
//   },
//   audienceName: '',
//   audienceSettings: {
//     personas: {
//       computation_key: AUDIENCE_KEY,
//       computation_id: AUDIENCE_ID
//     }
//   }
// }

describe('Delivr AI Audiences', () => {

  describe('gen_update_segment_payload() function', () => {
    describe('Success cases', () => {
      it('trivial', () => {
        // Given
        const payloads: Payload[] = [{} as Payload]
        const client_identifier_id = 'delivrai';
        // When
        const result = gen_update_segment_payload(payloads,client_identifier_id)

        // Then
        expect(result).toBeTruthy()
      })

      it('should group multiple payloads from the same user into one delivr ai event payload', () => {
        // Given
        const payloads: Payload[] = [
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_234',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_1234',
            segment_audience_key: 'delivr_buyers',
            segment_computation_action: 'enter',
            email: 'delivr.1234@examples.com',
            identifier: 'email'
          } as Payload
        ]
        const client_identifier_id = 'delivrai'
        // When
        const result = gen_update_segment_payload(payloads ,client_identifier_id)

        // Then
        expect(result).toBeTruthy()
        expect(result.data.length).toBe(2)
        expect(result.client_identifier_id).toContain('delivr')
      })
    })
  })
})
