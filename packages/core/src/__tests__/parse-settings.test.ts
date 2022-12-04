import { getOAuth2Data, updateOAuthSettings, getAuthData } from '../destination-kit/parse-settings'

describe('oauth settings', () => {
  test('getOAuth2Data should return oauth data', () => {
    const settings = {
      one: '1',
      two: '2',
      oauth: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        refresh_token_url: 'test.xyz'
      },
      three: '3'
    }

    const result = getOAuth2Data(settings)

    const expectedResult = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      refreshTokenUrl: 'test.xyz'
    }
    expect(result).toEqual(expectedResult)
  })

  test('getAuthData should return oauth data', () => {
    const settings = {
      one: '1',
      two: '2',
      oauth: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        refresh_token_url: 'test.xyz'
      },
      three: '3'
    }

    const result = getAuthData(settings)

    const expectedResult = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      refreshTokenUrl: 'test.xyz'
    }
    expect(result).toEqual(expectedResult)
  })

  test('should not contain oauth data', () => {
    const settings = {
      one: '1',
      two: '2',
      three: '3'
    }

    const result = getOAuth2Data(settings)
    const expectedResult = {
      accessToken: undefined,
      clientId: undefined,
      clientSecret: undefined,
      refreshToken: undefined,
      refreshTokenUrl: undefined
    }
    expect(result).toEqual(expectedResult)
  })

  test('should ', () => {
    const settings = {
      one: '1',
      oauth: {
        access_token: 'access-token'
      }
    }

    const result = updateOAuthSettings(settings, { accessToken: 'new-access-token' })
    const expectedResult = {
      one: '1',
      oauth: {
        access_token: 'new-access-token'
      }
    }
    expect(result).toEqual(expectedResult)
  })
})
