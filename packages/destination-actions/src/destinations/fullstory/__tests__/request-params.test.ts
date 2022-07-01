import {
  listOperationsRequestParams,
  customEventRequestParams,
  setUserPropertiesRequestParams,
  deleteUserRequestParams
} from '../request-params'
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

  describe('customEventRequestParams', () => {
    it('returns expected request params', () => {
      const requestValues = {
        userId,
        eventName: 'test-event',
        eventData: {
          'first-property': 'first-value',
          second_property: 'second_value',
          thirdProperty: 'thirdValue'
        },
        timestamp: new Date(Date.UTC(2022, 1, 2, 3, 4, 5)).toISOString(),
        useRecentSession: true,
        sessionUrl: 'session-url'
      }
      const { url, options } = customEventRequestParams(settings, requestValues)
      expect(options.method).toBe('post')
      expect(options.headers!['Content-Type']).toBe('application/json')
      expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
      expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}/customevent`)
      expect(options.json).toEqual({
        event: {
          event_name: requestValues.eventName,
          event_data: requestValues.eventData,
          timestamp: requestValues.timestamp,
          use_recent_session: requestValues.useRecentSession,
          session_url: requestValues.sessionUrl
        }
      })
    })

    it('handles undefined request values', () => {
      const requestValues = {
        userId,
        eventName: 'test-event',
        eventData: {}
      }
      const { url, options } = customEventRequestParams(settings, requestValues)
      expect(options.method).toBe('post')
      expect(options.headers!['Content-Type']).toBe('application/json')
      expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
      expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}/customevent`)
      expect(options.json).toEqual({
        event: {
          event_name: requestValues.eventName,
          event_data: requestValues.eventData
        }
      })
    })
  })

  describe('setUserProperties', () => {
    it('returns expected request params', () => {
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
    it('returns expected request params', () => {
      const { url, options } = deleteUserRequestParams(settings, userId)
      expect(options.method).toBe('delete')
      expect(options.headers!['Content-Type']).toBe('application/json')
      expect(options.headers!['Authorization']).toBe(`Basic ${settings.apiKey}`)
      expect(url).toBe(`${baseUrl}/users/v1/individual/${userId}`)
    })
  })
})
