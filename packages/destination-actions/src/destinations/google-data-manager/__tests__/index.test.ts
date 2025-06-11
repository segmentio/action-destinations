import destination from '../index'

describe('Google Data Manager Destination', () => {
  describe('authentication', () => {
    it('should have oauth2 scheme', () => {
      expect(destination.authentication?.scheme).toBe('oauth2')
    })

    it('should have a refreshAccessToken function', () => {
      expect(typeof (destination.authentication && (destination.authentication as any).refreshAccessToken)).toBe(
        'function'
      )
    })

    it('refreshAccessToken should return accessToken from response', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ data: { access_token: 'abc123' } })
      // @ts-expect-error: refreshAccessToken is not on all auth types
      const result = await destination.authentication?.refreshAccessToken?.(mockRequest, {
        auth: { refreshToken: 'r', clientId: 'c', clientSecret: 's' }
      })
      expect(result).toEqual({ accessToken: 'abc123' })
    })
  })

  describe('extendRequest', () => {
    it('should return headers with Bearer token', () => {
      const auth = { accessToken: 'token123', refreshToken: 'r', clientId: 'c', clientSecret: 's' }
      const req = destination.extendRequest?.({ auth })
      expect(req?.headers?.authorization).toBe('Bearer token123')
    })
  })

  describe('audienceConfig', () => {
    it('should have mode type synced and full_audience_sync false', () => {
      expect(destination.audienceConfig.mode.type).toBe('synced')
      // @ts-expect-error: full_audience_sync may not exist on all mode types
      expect(destination.audienceConfig.mode.full_audience_sync).toBe(false)
    })

    it('createAudience should return an object with externalId', async () => {
      // @ts-expect-error: createAudience may not exist on all configs
      const result = await destination.audienceConfig.createAudience?.({}, {})
      expect(result).toHaveProperty('externalId')
    })

    it('getAudience should return an object with externalId', async () => {
      // @ts-expect-error: getAudience may not exist on all configs
      const result = await destination.audienceConfig.getAudience?.({}, {})
      expect(result).toHaveProperty('externalId')
    })
  })

  describe('onDelete', () => {
    it('should be a function', () => {
      expect(typeof destination.onDelete).toBe('function')
    })
  })
})
