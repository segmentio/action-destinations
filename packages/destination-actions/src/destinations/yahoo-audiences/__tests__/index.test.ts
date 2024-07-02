import nock from 'nock'
import { IntegrationError, createTestIntegration } from '@segment/actions-core'

import Destination from '../index'
import { gen_update_segment_payload } from '../utils-rt'
import { Payload } from '../updateSegment/generated-types'

const AUDIENCE_ID = 'aud_123456789012345678901234567' // References audienceSettings.audience_id
const AUDIENCE_KEY = 'sneakers_buyers' // References audienceSettings.audience_key
const ENGAGE_SPACE_ID = 'acme_corp_engage_space' // References settings.engage_space_id
const MDM_ID = 'mdm 123' // References settings.mdm_id
const CUST_DESC = 'ACME Corp' // References settings.customer_desc

const createAudienceInput = {
  settings: {
    engage_space_id: ENGAGE_SPACE_ID,
    mdm_id: MDM_ID,
    customer_desc: CUST_DESC
  },
  audienceName: '',
  audienceSettings: {
    personas: {
      computation_key: AUDIENCE_KEY,
      computation_id: AUDIENCE_ID
    }
  }
}

describe('Yahoo Audiences', () => {
  describe('createAudience() function', () => {
    let testDestination: any
    const OLD_ENV = process.env
    beforeEach(() => {
      jest.resetModules() // Most important - it clears the cache
      process.env = { ...OLD_ENV } // Make a copy
      process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET = 'yoda'
      process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID = 'luke'
      testDestination = createTestIntegration(Destination)
    })

    afterAll(() => {
      process.env = OLD_ENV // Restore old environment
    })

    describe('Success cases', () => {
      it('It should create the audience successfully', async () => {
        nock('https://datax.yahooapis.com').put(`/v1/taxonomy/append/${ENGAGE_SPACE_ID}`).reply(202, {
          anything: '123'
        })

        //createAudienceInput.audienceSettings.identifier = 'anything'
        const result = await testDestination.createAudience(createAudienceInput)
        expect(result.externalId).toBe(AUDIENCE_ID)
      })
    })
    describe('Failure cases', () => {
      it('should throw an error when engage_space_id setting is missing', async () => {
        createAudienceInput.settings.engage_space_id = ''
        await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
      })
    })
  })

  describe('gen_update_segment_payload() function', () => {
    describe('Success cases', () => {
      it('trivial', () => {
        // Given
        const payloads: Payload[] = [{} as Payload]

        // When
        const result = gen_update_segment_payload(payloads)

        // Then
        expect(result).toBeTruthy()
      })

      it('should group multiple payloads from the same user into one Yahoo event payload', () => {
        // Given
        const payloads: Payload[] = [
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_234',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'daffyduck@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload
        ]

        // When
        const result = gen_update_segment_payload(payloads)

        // Then
        expect(result).toBeTruthy()
        expect(result.data.length).toBe(2)
        expect((result.data as any)[0][4]).toContain(';')
      })
    })
  })
})
