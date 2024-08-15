import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'

// Define test constants
const advertiserId = 'test_advertiser_id'
const audienceName = 'Test Audience'
const token = 'test_token'
const apiEndpoint = 'https://api.example.com'
const testDestination = createTestIntegration(Destination)

// Define settings for createAudience
const createAudienceSettings = {
  advertiserId,
  audienceType: 'CUSTOMER_MATCH_CONTACT_INFO', // Example value
  description: 'Test Audience Description',
  membershipDurationDays: '30',
  token
}

// Define createAudienceInput with the correct structure
const createAudienceInput = {
  settings: createAudienceSettings,
  audienceName: audienceName
}

describe('First Party Dv360', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      const input = { ...createAudienceInput, audienceName: '' }
      await expect(testDestination.createAudience(input)).rejects.toThrowError(IntegrationError)
    })

    it('creates an audience', async () => {
      nock(`${apiEndpoint}/create-audience`).post(/.*/).reply(200, {
        firstAndThirdPartyAudienceId: '456'
      })

      const result = await testDestination.createAudience(createAudienceInput)
      expect(result).toEqual({
        externalId: '456'
      })
    })

    it('errors out when audience creation fails', async () => {
      nock(`${apiEndpoint}/create-audience`).post(/.*/).reply(400, {
        error: 'Invalid request'
      })

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })
  })
})
