import { listOperationsRequestParams, setUserPropertiesRequestParams, deleteUserRequestParams } from '../request-params'
import { anonymousId, displayName, email, userId, baseUrl, settings } from './fullstory.test'

describe('requestParams', () => {
  describe('listOperations', () => {
    it(`returns expected request params`, () => {
      const { url, options } = listOperationsRequestParams(settings)
      expect(options.method).toBe('get')
      expect(options.headers!['Content-Type']).toBe('application/json')
      expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
      expect(url).toBe(`${baseUrl}/operations/v1?limit=1`)
    })
  })

  describe('setUserProperties', () => {
    it(`returns expected request params`, () => {
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
  })

  describe('deleteUser', () => {
    it(`returns expected request params`, () => {
      const { url, options } = deleteUserRequestParams(settings, userId)
      expect(options.method).toBe('delete')
      expect(options.headers!['Content-Type']).toBe('application/json')
      expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
      expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}`)
    })
  })
})
