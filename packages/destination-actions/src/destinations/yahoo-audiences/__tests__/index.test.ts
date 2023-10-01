import nock from 'nock'
import { IntegrationError, createTestIntegration } from '@segment/actions-core'

import Destination from '../index'

const AUDIENCE_ID = 'aud_12345' // References audienceSettings.audience_id
const AUDIENCE_KEY = 'sneakers_buyers' // References audienceSettings.audience_key
const ENGAGE_SPACE_ID = 'acme_corp_engage_space' // References settings.engage_space_id
const MDM_ID = 'mdm 123' // References settings.mdm_id
const TX_KEY = '123' // References settings.taxonomy_client_id
const TX_SECRET = '456' // References settings.taxonomy_client_secret
const CUST_DESC = 'ACME Corp' // References settings.customer_desc

const createAudienceInput = {
  settings: {
    engage_space_id: ENGAGE_SPACE_ID,
    mdm_id: MDM_ID,
    taxonomy_client_key: TX_KEY,
    taxonomy_client_secret: TX_SECRET,
    customer_desc: CUST_DESC
  },
  audienceName: '',
  audienceSettings: {
    audience_key: AUDIENCE_KEY,
    audience_id: AUDIENCE_ID
  }
}

describe('Yahoo Audiences', () => {
  describe('createAudience() function', () => {
    let testDestination: any

    beforeEach(() => {
      testDestination = createTestIntegration(Destination)
    })

    describe('Success cases', () => {
      it('It should create the audience successfully', async () => {
        nock('https://datax.yahooapis.com').put('/v1/taxonomy/append/345').reply(202, {
          anything: '123'
        })

        const result = await testDestination.createAudience(createAudienceInput)
        expect(result.externalId).toBe('123')
      })
    })
    describe('Failure cases', () => {
      it('should throw an error when audience_id setting is missing', async () => {
        createAudienceInput.settings.engage_space_id = 'acme_corp_engage_space'
        createAudienceInput.audienceSettings.audience_key = 'sneakeres_buyers'
        createAudienceInput.audienceSettings.audience_id = ''
        await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
      })

      it('should throw an error when audience_key setting is missing', async () => {
        createAudienceInput.settings.engage_space_id = 'acme_corp_engage_space'
        createAudienceInput.audienceSettings.audience_key = ''
        createAudienceInput.audienceSettings.audience_id = 'aud_12345'
        await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
      })

      it('should throw an error when engage_space_id setting is missing', async () => {
        createAudienceInput.settings.engage_space_id = ''
        createAudienceInput.audienceSettings.audience_key = 'sneakeres_buyers'
        createAudienceInput.audienceSettings.audience_id = 'aud_12345'
        await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
      })
    })
  })
})
