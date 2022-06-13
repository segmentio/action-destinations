import { Settings } from '../generated-types'
import { listOperationsRequestParams, setUserPropertiesRequestParams, deleteUserRequestParams } from '../request-params'
import { forEachDataRegion, anonymousId, displayName, email, userId, apiKey } from './fullstory.test'

const forEachDataRegionPlusFakeValues = (
  callback: (settings: Settings, baseUrl: string, isValidRegion: boolean) => void
) => {
  forEachDataRegion((settings, baseUrl) => callback(settings, baseUrl, true))
  const fakeDataRegions = ['', 'fake']
  fakeDataRegions.forEach((fakeRegion) => callback({ apiKey, region: fakeRegion }, 'fake-base-url', false))
}

describe('requestParams', () => {
  describe('listOperations', () => {
    forEachDataRegionPlusFakeValues((settings, baseUrl, isValidRegion) => {
      if (isValidRegion) {
        it(`returns expected request params for region ${settings.region}`, () => {
          const { url, options } = listOperationsRequestParams(settings)
          expect(options.method).toBe('get')
          expect(options.headers!['Content-Type']).toBe('application/json')
          expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
          expect(url).toBe(`${baseUrl}/operations/v1?limit=1`)
        })
      } else {
        it(`throws for fake region '${settings.region}'`, () => {
          expect(() => listOperationsRequestParams(settings)).toThrowError()
        })
      }
    })
  })

  describe('setUserProperties', () => {
    forEachDataRegionPlusFakeValues((settings, baseUrl, isValidRegion) => {
      if (isValidRegion) {
        it(`returns expected request params for region ${settings.region}`, () => {
          const requestBody = {
            anonymousId,
            traits: {
              displayName,
              email
            }
          }
          const { url, options } = setUserPropertiesRequestParams(settings, userId, requestBody)
          expect(options.method).toBe('post')
          expect(options.headers!['Content-Type']).toBe('application/json')
          expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
          expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}/customvars`)
          expect(options.body).toBe(JSON.stringify(requestBody))
        })
      } else {
        it(`throws for fake region '${settings.region}'`, () => {
          expect(() => setUserPropertiesRequestParams(settings, userId, {})).toThrowError()
        })
      }
    })
  })

  describe('deleteUser', () => {
    forEachDataRegionPlusFakeValues((settings, baseUrl, isValidRegion) => {
      if (isValidRegion) {
        it(`returns expected request params for region ${settings.region}`, () => {
          const { url, options } = deleteUserRequestParams(settings, userId)
          expect(options.method).toBe('delete')
          expect(options.headers!['Content-Type']).toBe('application/json')
          expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
          expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}`)
        })
      } else {
        it(`throws for fake region ${settings.region}`, () => {
          expect(() => deleteUserRequestParams(settings, userId)).toThrowError()
        })
      }
    })
  })
})
