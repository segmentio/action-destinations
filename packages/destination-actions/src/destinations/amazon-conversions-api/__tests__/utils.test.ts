import { getAuthToken } from '../utils'
import nock from 'nock'
import { OAuth2ClientCredentials, RequestClient } from '@segment/actions-core'

describe('Amazon Conversions API Utils', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('getAuthToken', () => {
    it('should successfully refresh access token', async () => {
      const mockAccessToken = 'new-access-token-123'
      const auth = { refreshToken: 'test-refresh-token', accessToken: 'old-token' }

      nock('https://api.amazon.com')
        .post('/auth/o2/token')
        .reply(200, { access_token: mockAccessToken })

      // Create mock request function that returns the expected response
      const mockRequest = jest.fn().mockResolvedValue({
        data: { access_token: mockAccessToken }
      })

      const token = await getAuthToken(mockRequest as RequestClient, auth as OAuth2ClientCredentials)
      expect(token).toBe(mockAccessToken)

      // Verify the request was made with correct parameters
      expect(mockRequest).toHaveBeenCalled()
      expect(mockRequest.mock.calls[0][0]).toBe('https://api.amazon.com/auth/o2/token')

      // Safe access to call arguments
      const callArg1 = mockRequest.mock.calls[0][1]
      expect(callArg1).toBeDefined()
      expect(callArg1.method).toBe('POST')
      expect(callArg1.headers).toBeDefined()
      expect(callArg1.headers.authorization).toBe('')

      // Safely check URLSearchParams
      expect(callArg1.body).toBeInstanceOf(URLSearchParams)
      const bodyParams = callArg1.body.toString()
      expect(bodyParams).toContain('grant_type=refresh_token')
      expect(bodyParams).toContain(`refresh_token=${auth.refreshToken}`)
    })

    it('should handle missing environment variables', async () => {
      // Save original env vars
      const originalClientId = process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID
      const originalClientSecret = process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_SECRET

      try {
        // Remove env vars to test handling of missing values
        delete process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID
        delete process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_SECRET

        const auth = { refreshToken: 'test-refresh-token', accessToken: 'old-token' }

        // Create mock request function with successful response
        const mockRequest = jest.fn().mockResolvedValue({
          data: { access_token: 'new-token' }
        })

        await getAuthToken(mockRequest as RequestClient, auth as OAuth2ClientCredentials)

        // Check that request was called
        expect(mockRequest).toHaveBeenCalled()

        // Safely check call arguments
        const callArg1 = mockRequest.mock.calls[0][1]
        expect(callArg1).toBeDefined()
        expect(callArg1.body).toBeInstanceOf(URLSearchParams)

        // Check URLSearchParams content
        const bodyParams = callArg1.body.toString()
        expect(bodyParams).toContain('client_id=')
        expect(bodyParams).toContain('client_secret=')
      } finally {
        // Ensure env vars are always restored
        process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_ID = originalClientId
        process.env.ACTIONS_AMAZON_CONVERSIONS_API_CLIENT_SECRET = originalClientSecret
      }
    })
  })
})
