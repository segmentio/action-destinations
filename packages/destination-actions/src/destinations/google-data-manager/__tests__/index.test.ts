import destination from '../index'
import { IntegrationError } from '@segment/actions-core'
import { AudienceDestinationConfigurationWithCreateGet, StatsClient } from '@segment/actions-core/destination-kit'

jest.mock('../data-partner-token', () => ({
  getDataPartnerToken: jest.fn(() => 'mocked-token')
}))

describe('Google Data Manager Destination', () => {
  const mockRequest = jest.fn()
  const statsClient = { incr: jest.fn() } as unknown as StatsClient
  const statsContext = { statsClient, tags: [] }
  const settings = {}
  const audienceSettings = {
    advertiserAccountId: '12345',
    product: 'GOOGLE_ADS',
    description: 'desc',
    membershipDurationDays: '30'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    mockRequest.mockReset()
  })
  describe('createAudience', () => {
    it('creates audience successfully', async () => {
      // Mock product link search response
      mockRequest.mockResolvedValueOnce({
        status: 200,
        json: async () => [{ results: [{ productLink: { resourceName: 'link' } }] }]
      })

      // Mock create audience response
      mockRequest.mockResolvedValueOnce({
        json: async () => ({
          results: [{ resourceName: 'products/GOOGLE_ADS/customers/1041098592/userLists/9129978598' }]
        })
      })
      const result = await (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(
        mockRequest,
        {
          audienceName: 'Test Audience',
          settings,
          statsContext,
          audienceSettings
        }
      )
      expect(mockRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: expect.any(String),
          headers: expect.any(Object),
          body: JSON.stringify({
            query: `SELECT product_link.google_ads.google_ads_customer FROM product_link WHERE product_link.google_ads.google_ads_customer = 'products/GOOGLE_ADS/customers/12345'`
          })
        })
      )

      expect(result).toEqual({ externalId: '9129978598' })
      expect(statsClient.incr).toHaveBeenCalledWith('createAudience.success', 1, expect.any(Array))
    })

    it('throws error if audienceName is missing', async () => {
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
          audienceName: '',
          settings,
          statsContext,
          audienceSettings
        })
      ).rejects.toThrow(IntegrationError)
    })

    it('throws error if audienceSettings is missing', async () => {
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
          audienceName: 'Test',
          settings,
          statsContext,
          audienceSettings: null
        })
      ).rejects.toThrow(IntegrationError)
    })

    it('throws error if product link fetch fails', async () => {
      mockRequest.mockResolvedValueOnce({ status: 404, statusText: 'Not Found', json: async () => ({}) })
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
          audienceName: 'Test',
          settings,
          statsContext,
          audienceSettings
        })
      ).rejects.toThrow('Failed to fetch product link: Not Found')
    })

    it('throws error if product link missing in response', async () => {
      mockRequest.mockResolvedValueOnce({ status: 200, json: async () => [{}] })
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
          audienceName: 'Test',
          settings,
          statsContext,
          audienceSettings
        })
      ).rejects.toThrow('Expected productLink in response')
    })

    it('throws error if product is missing', async () => {
      mockRequest.mockResolvedValueOnce({
        status: 200,
        json: async () => [{ results: [{ productLink: { resourceName: 'link' } }] }]
      })
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).createAudience(mockRequest, {
          audienceName: 'Test',
          settings,
          statsContext,
          audienceSettings: { ...audienceSettings, product: null }
        })
      ).rejects.toThrow('Missing product value')
    })
  })

  describe('getAudience', () => {
    it('gets audience successfully', async () => {
      mockRequest.mockResolvedValueOnce({
        json: async () => [{ results: [{ userList: { resourceName: 'audience/1' } }] }]
      })
      const result = await (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(
        mockRequest,
        {
          statsContext,
          settings,
          audienceSettings,
          externalId: 'audience/1'
        }
      )
      expect(result).toEqual({ externalId: 'audience/1' })
      expect(statsClient.incr).toHaveBeenCalledWith('getAudience.success', 1, expect.any(Array))
    })

    it('throws error if advertiserId is missing', async () => {
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(mockRequest, {
          statsContext,
          settings,
          audienceSettings: { ...audienceSettings, advertiserAccountId: '' },
          externalId: 'audience/1'
        })
      ).rejects.toThrow(IntegrationError)
    })

    it('throws error if audience not found', async () => {
      mockRequest.mockResolvedValueOnce({
        json: async () => [{ results: [{}] }]
      })
      await expect(
        (destination.audienceConfig as AudienceDestinationConfigurationWithCreateGet).getAudience(mockRequest, {
          statsContext,
          settings,
          audienceSettings,
          externalId: 'audience/1'
        })
      ).rejects.toThrow('Audience not found')
    })
  })
})
