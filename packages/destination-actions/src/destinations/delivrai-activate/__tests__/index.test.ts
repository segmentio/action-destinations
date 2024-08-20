import { gen_update_segment_payload } from '../utils-rt'
import { Payload } from '../updateSegment/generated-types'

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
