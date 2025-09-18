import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { BASE_URL, TOKEN_URL } from '../constants'

const testDestination = createTestIntegration(Destination)

// Test constants
const audienceName = 'Test Audience'
const audienceId = '12345'
const developerToken = 'dev-token-123'
const customerAccountId = 'account-123'
const customerId = 'customer-123'

// Test inputs
const settings = {
  developerToken,
  customerAccountId,
  customerId
}

const createAudienceInput = {
  settings,
  audienceName,
  audienceSettings: {}
}

const getAudienceInput = {
  settings,
  externalId: audienceId,
  audienceSettings: {}
}

describe('Bing Ads Audiences', () => {
  describe('Authentication', () => {
    it('should refresh access token successfully', async () => {
      const mockRequest = {
        refresh_token: 'xyz321',
        client_id: 'clientId',
        client_secret: 'clientSecret',
        grant_type: 'refresh_token',
        scope: 'https://ads.microsoft.com/msads.manage offline_access'
      }
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      }
      nock(TOKEN_URL).post('', new URLSearchParams(mockRequest).toString()).reply(200, mockResponse)

      const token = await testDestination.refreshAccessToken(settings, {
        refreshToken: 'xyz321',
        accessToken: 'abc123',
        clientId: 'clientId',
        clientSecret: 'clientSecret'
      })

      expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
    })
  })

  describe('createAudience', () => {
    it('should create an audience successfully', async () => {
      nock(BASE_URL)
        .post('/Audiences', {
          Audiences: [
            {
              Name: audienceName,
              Type: 'CustomerList'
            }
          ]
        })
        .reply(200, {
          AudienceIds: [audienceId],
          PartialErrors: []
        })

      const result = await testDestination.createAudience(createAudienceInput)
      expect(result).toEqual({ externalId: audienceId })
    })

    it('should throw an IntegrationError when terms and conditions are not accepted', async () => {
      nock(BASE_URL)
        .post('/Audiences')
        .reply(200, {
          AudienceIds: [],
          PartialErrors: [
            {
              ErrorCode: 'CustomerListTermsAndConditionsNotAccepted',
              Message: 'Terms and conditions not accepted'
            }
          ]
        })

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrow(IntegrationError)
    })

    it('should throw an IntegrationError when no audience ID is returned', async () => {
      nock(BASE_URL).post('/Audiences').reply(200, {
        AudienceIds: [],
        PartialErrors: []
      })

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrow(IntegrationError)
    })
  })

  describe('getAudience', () => {
    it('should get an audience successfully', async () => {
      nock(BASE_URL)
        .post('/Audiences/QueryByIds', {
          AudienceIds: [audienceId],
          Type: 'CustomerList'
        })
        .reply(200, {
          Audiences: [
            {
              Id: audienceId
            }
          ]
        })

      const result = await testDestination.getAudience(getAudienceInput)
      expect(result).toEqual({ externalId: audienceId })
    })
  })
})
