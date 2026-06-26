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

    it('should surface an unrecognized PartialError with Bing ErrorCode and Message', async () => {
      const partialErrorResponse = {
        AudienceIds: [],
        PartialErrors: [
          {
            ErrorCode: 'CampaignServiceDuplicateAudienceName',
            Message: 'An audience with this name already exists.',
            Code: 4848,
            Index: 0
          }
        ]
      }
      nock(BASE_URL).post('/Audiences').reply(200, partialErrorResponse)

      const error = await testDestination.createAudience(createAudienceInput).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toBe(
        'Failed to create audience: CampaignServiceDuplicateAudienceName: An audience with this name already exists.'
      )
      expect(error.code).toBe('CampaignServiceDuplicateAudienceName')
      expect(error.status).toBe(400)
    })

    it('should throw an IntegrationError surfacing Bing status and body on a non-2xx error', async () => {
      nock(BASE_URL).post('/Audiences').reply(400, 'Bad Request')

      const error = await testDestination.createAudience(createAudienceInput).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toBe('Failed to create audience. Microsoft Bing Ads returned HTTP 400: Bad Request')
      expect(error.code).toBe('CREATE_AUDIENCE_FAILED')
      expect(error.status).toBe(400)
    })

    it('should surface Bing status when the API returns a 5xx with an empty body', async () => {
      nock(BASE_URL).post('/Audiences').reply(500, '')

      const error = await testDestination.createAudience(createAudienceInput).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toBe('Failed to create audience. Microsoft Bing Ads returned HTTP 500: no response body')
      expect(error.code).toBe('CREATE_AUDIENCE_FAILED')
      expect(error.status).toBe(500)
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
