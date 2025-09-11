import { createTestIntegration, IntegrationError, OAuth2Authentication } from '@segment/actions-core'
import destination from '../index'
import { AudienceDestinationConfigurationWithCreateGet, StatsClient } from '@segment/actions-core/destination-kit'

const testDestination = createTestIntegration(destination)
// Mocks
jest.mock('../shared', () => ({
  buildHeaders: jest.fn(() => ({})),
  getAuthSettings: jest.fn(() => ({})),
  getAuthToken: jest.fn(() => 'mock-token')
}))
jest.mock('../errors', () => ({
  handleRequestError: jest.fn((error) => error)
}))
jest.mock('../functions', () => ({
  verifyCustomerId: jest.fn()
}))

const mockRequest = jest.fn()
const mockStatsClient = { incr: jest.fn() } as unknown as StatsClient

const baseSettings = { advertiserAccountId: '12345' }
const baseAudienceSettings = { description: 'desc', membershipDurationDays: '30' }

// Helper to reset mocks
function resetMocks() {
  jest.clearAllMocks()
  mockRequest.mockReset()
}

describe('Google Data Manager Destination', () => {
  beforeEach(resetMocks)

  describe('authentication', () => {
    it('should authenticate successfully', async () => {
      mockRequest.mockResolvedValue({ status: 200 })
      const result = await testDestination.authentication?.testAuthentication?.(mockRequest, {
        auth: { accessToken: 'token', refreshToken: 'test-refresh-token' },
        settings: baseSettings
      })
      expect((result as any).status).toBe(200)
    })

    it('should fail authentication with missing token', async () => {
      await expect(
        testDestination.authentication?.testAuthentication?.(mockRequest, {
          auth: { accessToken: '', refreshToken: 'test-refresh-token' },
          settings: baseSettings
        })
      ).rejects.toThrow('Missing access token for authentication test.')
    })

    it('should fail authentication with bad response', async () => {
      mockRequest.mockResolvedValue({ status: 401, statusText: 'Unauthorized' })
      await expect(
        testDestination.authentication?.testAuthentication?.(mockRequest, {
          auth: { accessToken: 'token', refreshToken: 'test-refresh-token' },
          settings: baseSettings
        })
      ).rejects.toThrow('Authentication failed: Unauthorized')
    })

    it('should refresh access token', async () => {
      mockRequest.mockResolvedValue({ json: async () => ({ access_token: 'new-token' }) })
      const response = await (destination.authentication as OAuth2Authentication<any>).refreshAccessToken?.(
        mockRequest,
        { settings: undefined, auth: { clientId: 'cid', clientSecret: 'cs', refreshToken: 'rt', accessToken: '' } }
      )
      expect(response?.accessToken).toBe('new-token')
    })

    describe('audienceConfig', () => {
      it('should create audience successfully', async () => {
        mockRequest.mockResolvedValue({ json: async () => ({ results: [{ resourceName: 'aud-id' }] }) })
        const result = await (
          destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet
        ).createAudience(mockRequest, {
          audienceName: 'Test Audience',
          settings: baseSettings,
          statsContext: { statsClient: mockStatsClient, tags: [] },
          audienceSettings: baseAudienceSettings
        })
        expect(result.externalId).toBe('aud-id')
        expect(mockStatsClient.incr).toHaveBeenCalledWith('createAudience.success', 1, expect.any(Array))
      })

      it('should throw error if audienceName is missing', async () => {
        await expect(
          (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
            audienceName: '',
            settings: baseSettings,
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          })
        ).rejects.toThrow(IntegrationError)
      })

      it('should handle error in createAudience', async () => {
        mockRequest.mockRejectedValue(new Error('fail'))
        await expect(
          (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
            audienceName: 'Test Audience',
            settings: baseSettings,
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          })
        ).rejects.toThrow('fail')
      })

      it('should get audience successfully', async () => {
        mockRequest.mockResolvedValue({ json: async () => [{ results: [{ userList: { resourceName: 'aud-id' } }] }] })
        const result = await (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(
          mockRequest,
          {
            externalId: 'aud-id',
            settings: baseSettings,
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          }
        )
        expect(result.externalId).toBe('aud-id')
        expect(mockStatsClient.incr).toHaveBeenCalledWith('getAudience.success', 1, expect.any(Array))
      })

      it('should throw error if advertiserId is missing in getAudience', async () => {
        await expect(
          (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(mockRequest, {
            externalId: 'aud-id',
            settings: { advertiserAccountId: '' },
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          })
        ).rejects.toThrow(IntegrationError)
      })

      it('should throw error if foundId does not match externalId', async () => {
        mockRequest.mockResolvedValue({ json: async () => [{ results: [{ userList: { resourceName: 'other-id' } }] }] })
        await expect(
          (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(mockRequest, {
            externalId: 'aud-id',
            settings: baseSettings,
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          })
        ).rejects.toThrow(IntegrationError)
      })

      it('should handle error in getAudience', async () => {
        mockRequest.mockRejectedValue(new Error('fail'))
        await expect(
          (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(mockRequest, {
            externalId: 'aud-id',
            settings: baseSettings,
            statsContext: { statsClient: mockStatsClient, tags: [] },
            audienceSettings: baseAudienceSettings
          })
        ).rejects.toThrow('fail')
      })
    })
  })
})
