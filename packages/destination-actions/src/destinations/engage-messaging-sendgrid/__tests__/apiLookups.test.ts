import nock from 'nock'
import { ApiLookupConfig, getRequestId, performApiLookup } from '../previewApiLookup/apiLookups'
import { DataFeedCache } from '../../../../../core/src/destination-kit/index'
import createRequestClient from '../../../../../core/src/create-request-client'

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
  cacheTtl: 60000
}

const createMockRequestStore = (overrides?: Partial<DataFeedCache>) => {
  const mockStore: Record<string, any> = {}
  const mockDataFeedCache: DataFeedCache = {
    setRequestResponse: jest.fn(async (requestId, response) => {
      mockStore[requestId] = response
    }),
    getRequestResponse: jest.fn(async (requestId) => {
      return mockStore[requestId]
    }),
    maxExpirySeconds: 600000,
    maxResponseSizeBytes: 1000000,
    ...overrides
  }
  return mockDataFeedCache
}

const request = createRequestClient({})

afterEach(() => {
  jest.clearAllMocks()
  nock.cleanAll()
})

describe('api lookups', () => {
  it('liquid renders url and body with profile traits before requesting', async () => {
    const apiLookupRequest = nock(`https://fakeweather.com`)
      .post(`/api/${profile.traits.lastName}`, { firstName: profile.traits.firstName })
      .reply(200, {
        current: {
          temperature: 70
        }
      })

    const data = await performApiLookup(
      request,
      {
        ...nonCachedApiLookup,
        url: 'https://fakeweather.com/api/{{profile.traits.lastName}}',
        body: '{ "firstName": "{{profile.traits.firstName}}" }',
        method: 'post'
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

  it('rethrows error when shouldRetryOnRetryableError is true and api call fails', async () => {
    const apiLookupRequest = nock(`https://fakeweather.com`).get(`/api/current`).reply(429)

    await expect(
      performApiLookup(
        request,
        {
          ...nonCachedApiLookup,
          shouldRetryOnRetryableError: true
        },
        profile,
        undefined,
        [],
        settings,
        undefined,
        undefined
      )
    ).rejects.toThrowError()

    expect(apiLookupRequest.isDone()).toEqual(true)
  })

  it('does not rethrow error and returns empty object when shouldRetryOnRetryableError is false and api call fails', async () => {
    const apiLookupRequest = nock(`https://fakeweather.com`).get(`/api/current`).reply(429)

    const data = await performApiLookup(
      request,
      {
        ...nonCachedApiLookup,
        shouldRetryOnRetryableError: false
      },
      profile,
      undefined,
      [],
      settings,
      undefined,
      undefined
    )

    expect(apiLookupRequest.isDone()).toEqual(true)
    expect(data).toEqual({})
  })

  describe('when cacheTtl > 0', () => {
    it('throws error if cache is not available', async () => {
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      await expect(
        performApiLookup(request, cachedApiLookup, profile, undefined, [], settings, undefined, undefined)
      ).rejects.toThrowError('Data feed cache not available and cache needed')

      expect(apiLookupRequest.isDone()).toEqual(false)
    })

    it('throws error if response size is too big', async () => {
      const mockDataFeedCache = createMockRequestStore({ maxResponseSizeBytes: 1 })
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      await expect(
        performApiLookup(request, cachedApiLookup, profile, undefined, [], settings, undefined, mockDataFeedCache)
      ).rejects.toThrowError('Data feed response size too big too cache and caching needed, failing send')

      expect(apiLookupRequest.isDone()).toEqual(true)
    })

    it('sets cache when cache miss', async () => {
      const mockDataFeedCache = createMockRequestStore()
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
        mockDataFeedCache
      )

      expect(apiLookupRequest.isDone()).toEqual(true)
      const requestId = getRequestId(cachedApiLookup)
      expect(mockDataFeedCache.setRequestResponse).toHaveBeenCalledWith(
        requestId,
        '{"current":{"temperature":70}}',
        cachedApiLookup.cacheTtl / 1000
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

      const mockDataFeedCache = createMockRequestStore()
      const requestId = getRequestId(cachedApiLookup)
      await mockDataFeedCache.setRequestResponse(requestId, '{"current":{"temperature":70}}', cachedApiLookup.cacheTtl)

      const data = await performApiLookup(
        request,
        cachedApiLookup,
        profile,
        undefined,
        [],
        settings,
        undefined,
        mockDataFeedCache
      )

      expect(apiLookupRequest.isDone()).toEqual(false)
      expect(data).toEqual({
        current: {
          temperature: 70
        }
      })
    })

    describe('cached responses are unique dependent on api config post liquid rendering value', () => {
      const profiles = [{ traits: { lastName: 'Browning' } }, { traits: { lastName: 'Smith' } }]

      it('url is different', async () => {
        const mockDataFeedCache = createMockRequestStore()
        const config: ApiLookupConfig = {
          url: 'https://fakeweather.com/api/current/{{profile.traits.lastName}}',
          method: 'get',
          name: 'test',
          cacheTtl: 60000,
          responseType: 'json'
        }

        for (const [i, profile] of profiles.entries()) {
          const renderedPath = `/api/current/${profile.traits.lastName}`
          const profileSpecificTemperature = profile.traits.lastName === 'Browning' ? 70 : 60

          const apiLookupRequest = nock(`https://fakeweather.com`)
            .get(renderedPath)
            .reply(200, {
              current: {
                temperature: profileSpecificTemperature
              }
            })

          const data = await performApiLookup(
            request,
            config,
            profile,
            undefined,
            [],
            settings,
            undefined,
            mockDataFeedCache
          )

          expect(apiLookupRequest.isDone()).toEqual(true)

          const requestId = getRequestId({ ...config, url: `https://fakeweather.com${renderedPath}` })

          expect(mockDataFeedCache.setRequestResponse).toHaveBeenNthCalledWith(
            i + 1,
            requestId,
            `{"current":{"temperature":${profileSpecificTemperature}}}`,
            cachedApiLookup.cacheTtl / 1000
          )

          expect(data).toEqual({
            current: {
              temperature: profileSpecificTemperature
            }
          })
        }
      })

      it('body is different', async () => {
        const mockDataFeedCache = createMockRequestStore()
        const config: ApiLookupConfig = {
          url: 'https://fakeweather.com/api/current',
          method: 'post',
          body: '{"lastName":"{{profile.traits.lastName}}"}',
          name: 'test',
          cacheTtl: 60000,
          responseType: 'json'
        }

        for (const [i, profile] of profiles.entries()) {
          const renderedBody = { lastName: profile.traits.lastName }
          const profileSpecificTemperature = profile.traits.lastName === 'Browning' ? 70 : 60

          const apiLookupRequest = nock(`https://fakeweather.com`)
            .post('/api/current', renderedBody)
            .reply(200, {
              current: {
                temperature: profileSpecificTemperature
              }
            })

          const data = await performApiLookup(
            request,
            config,
            profile,
            undefined,
            [],
            settings,
            undefined,
            mockDataFeedCache
          )

          expect(apiLookupRequest.isDone()).toEqual(true)

          const requestId = getRequestId({ ...config, body: JSON.stringify(renderedBody) })

          expect(mockDataFeedCache.setRequestResponse).toHaveBeenNthCalledWith(
            i + 1,
            requestId,
            `{"current":{"temperature":${profileSpecificTemperature}}}`,
            cachedApiLookup.cacheTtl / 1000
          )

          expect(data).toEqual({
            current: {
              temperature: profileSpecificTemperature
            }
          })
        }
      })

      it('headers are different', async () => {
        const mockDataFeedCache = createMockRequestStore()
        const config1: ApiLookupConfig = {
          url: 'https://fakeweather.com/api/current',
          method: 'get',
          headers: { a: 'a' },
          name: 'test',
          cacheTtl: 60000,
          responseType: 'json'
        }

        const config2: ApiLookupConfig = {
          ...config1,
          headers: { a: 'b' }
        }

        for (const [i, config] of [config1, config2].entries()) {
          const configSpecificTemperature = JSON.stringify(config.headers) === JSON.stringify(config1.headers) ? 70 : 60

          const apiLookupRequest = nock(`https://fakeweather.com`, {
            reqheaders: config.headers as Record<string, string>
          })
            .get('/api/current')
            .reply(200, {
              current: {
                temperature: configSpecificTemperature
              }
            })

          const data = await performApiLookup(
            request,
            config,
            profile,
            undefined,
            [],
            settings,
            undefined,
            mockDataFeedCache
          )

          expect(apiLookupRequest.isDone()).toEqual(true)

          const requestId = getRequestId({ ...config, headers: config.headers })

          expect(mockDataFeedCache.setRequestResponse).toHaveBeenNthCalledWith(
            i + 1,
            requestId,
            `{"current":{"temperature":${configSpecificTemperature}}}`,
            cachedApiLookup.cacheTtl / 1000
          )

          expect(data).toEqual({
            current: {
              temperature: configSpecificTemperature
            }
          })
        }
      })

      it('methods are different', async () => {
        const mockDataFeedCache = createMockRequestStore()
        const config1: ApiLookupConfig = {
          url: 'https://fakeweather.com/api/current',
          method: 'get',
          name: 'test',
          cacheTtl: 60000,
          responseType: 'json'
        }

        const config2: ApiLookupConfig = {
          ...config1,
          method: 'post'
        }

        for (const [i, config] of [config1, config2].entries()) {
          const configSpecificTemperature = JSON.stringify(config.headers) === JSON.stringify(config1.headers) ? 70 : 60

          const apiLookupRequest = nock(`https://fakeweather.com`)
            .intercept('/api/current', config.method)
            .reply(200, {
              current: {
                temperature: configSpecificTemperature
              }
            })

          const data = await performApiLookup(
            request,
            config,
            profile,
            undefined,
            [],
            settings,
            undefined,
            mockDataFeedCache
          )

          expect(apiLookupRequest.isDone()).toEqual(true)

          const requestId = getRequestId({ ...config })

          expect(mockDataFeedCache.setRequestResponse).toHaveBeenNthCalledWith(
            i + 1,
            requestId,
            `{"current":{"temperature":${configSpecificTemperature}}}`,
            cachedApiLookup.cacheTtl / 1000
          )

          expect(data).toEqual({
            current: {
              temperature: configSpecificTemperature
            }
          })
        }
      })
    })
  })

  describe('when cacheTtl = 0', () => {
    it('does not set or lookup cache', async () => {
      const mockDataFeedCache = createMockRequestStore()
      const apiLookupRequest = nock(`https://fakeweather.com`)
        .get(`/api/current`)
        .reply(200, {
          current: {
            temperature: 70
          }
        })

      await performApiLookup(
        request,
        nonCachedApiLookup,
        profile,
        undefined,
        [],
        settings,
        undefined,
        mockDataFeedCache
      )

      expect(apiLookupRequest.isDone()).toEqual(true)
      expect(mockDataFeedCache.setRequestResponse).not.toHaveBeenCalled()
      expect(mockDataFeedCache.getRequestResponse).not.toHaveBeenCalled()
    })
  })
})
