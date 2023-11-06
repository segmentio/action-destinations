import nock from 'nock'
import { getRequestId, performApiLookup } from '../previewApiLookup'
import createRequestClient from '../../../../../../core/src/create-request-client'
import { RequestCache } from '../../../../../../core/src/destination-kit/'

const profile = {
  traits: {
    userId: 'jane',
    firstName: 'First Name',
    lastName: 'Browning',
    phone: '+11235554657',
    email: 'test@example.com'
  }
}

const settings = {
  unlayerApiKey: 'unlayerApiKey',
  sendGridApiKey: 'sendGridApiKey',
  profileApiEnvironment: 'staging',
  profileApiAccessToken: 'c',
  spaceId: 'spaceId',
  sourceId: 'sourceId',
  region: 'us-west-2'
}

const nonCachedApiLookup = {
  id: '1',
  name: 'weather',
  url: 'https://fakeweather.com/api/current',
  method: 'get',
  cacheTtl: 0,
  responseType: 'json'
}

const cachedApiLookup = {
  ...nonCachedApiLookup,
  cacheTtl: 60
}

const createMockRequestStore = () => {
  const mockStore: Record<string, any> = {}
  const mockRequestCache: RequestCache = {
    setRequestResponse: jest.fn(async (requestId, response) => {
      mockStore[requestId] = response
    }),
    getRequestResponse: jest.fn(async (requestId) => {
      return mockStore[requestId]
    })
  }
  return mockRequestCache
}

const request = createRequestClient({})

afterEach(() => {
  jest.clearAllMocks()
  nock.cleanAll()
})

describe('api lookups', () => {
  it('liquid renders url and body with profile traits before requesting', async () => {
    const apiLookupRequest = nock(`https://fakeweather.com`)
      .get(`/api/${profile.traits.lastName}`)
      .reply(200, {
        current: {
          temperature: 70
        }
      })

    const data = await performApiLookup(
      request,
      {
        ...nonCachedApiLookup,
        url: 'https://fakeweather.com/api/{{profile.traits.lastName}}'
      },
      profile,
      undefined,
      [],
      settings,
      undefined,
      undefined
    )

    expect(apiLookupRequest.isDone()).toEqual(true)
    expect(data).toEqual({
      current: {
        temperature: 70
      }
    })
  })

  describe('when cacheTtl > 0', () => {
    it('sets cache when cache miss', async () => {
      const mockRequestCache = createMockRequestStore()
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      const data = await performApiLookup(
        request,
        cachedApiLookup,
        profile,
        undefined,
        [],
        settings,
        undefined,
        mockRequestCache
      )

      expect(apiLookupRequest.isDone()).toEqual(true)
      const requestId = getRequestId(cachedApiLookup)
      expect(mockRequestCache.setRequestResponse).toHaveBeenCalledWith(
        requestId,
        '{"current":{"temperature":70}}',
        cachedApiLookup.cacheTtl
      )
      expect(data).toEqual({
        current: {
          temperature: 70
        }
      })
    })

    it('uses cache when cache entry exists', async () => {
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      const mockRequestCache = createMockRequestStore()
      const requestId = getRequestId(cachedApiLookup)
      await mockRequestCache.setRequestResponse(requestId, '{"current":{"temperature":70}}', cachedApiLookup.cacheTtl)

      const data = await performApiLookup(
        request,
        cachedApiLookup,
        profile,
        undefined,
        [],
        settings,
        undefined,
        mockRequestCache
      )

      expect(apiLookupRequest.isDone()).toEqual(false)
      expect(data).toEqual({
        current: {
          temperature: 70
        }
      })
    })
  })

  describe('when cacheTtl = 0', () => {
    it('does not set or lookup cache', async () => {
      const mockRequestCache = createMockRequestStore()
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      await performApiLookup(request, nonCachedApiLookup, profile, undefined, [], settings, undefined, mockRequestCache)

      expect(apiLookupRequest.isDone()).toEqual(true)
      expect(mockRequestCache.setRequestResponse).not.toHaveBeenCalled()
      expect(mockRequestCache.getRequestResponse).not.toHaveBeenCalled()
    })
  })
})
