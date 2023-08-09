import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Definition from '../index'

export const apiKey = 'fake-api-key'
export const userId = 'fake/user/id'
export const urlEncodedUserId = encodeURIComponent(userId)
export const anonymousId = 'fake-anonymous-id'
export const email = 'fake+email@example.com'
export const displayName = 'fake-display-name'
export const baseUrl = 'https://api.fullstory.com'
export const settings = { apiKey }
export const integrationSource = 'segment'
export const integrationSourceQueryParam = `integration=${integrationSource}`

const testDestination = createTestIntegration(Definition)

describe('FullStory', () => {
  describe('testAuthentication', () => {
    it('makes expected request', async () => {
      nock(baseUrl).get('/operations/v1?limit=1').reply(200)
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('trackEvent', () => {
    it('makes expected request with default mappings', async () => {
      nock(baseUrl)
        .post(`/users/v1/individual/${urlEncodedUserId}/customevent?${integrationSourceQueryParam}`)
        .reply(200)
      const eventName = 'test-event'

      const properties = {
        'first-property': 'first-value',
        second_property: 'second_value',
        thirdProperty: 'thirdValue',
        useRecentSession: true,
        sessionUrl: 'session-url'
      }

      const timestamp = new Date(Date.UTC(2022, 1, 2, 3, 4, 5)).toISOString()

      const event = createTestEvent({
        type: 'track',
        userId,
        event: eventName,
        timestamp,
        properties
      })

      const [response] = await testDestination.testAction('trackEvent', {
        settings,
        event,
        // Default mappings defined under fields in ../trackEvent/index.ts
        useDefaultMappings: true,
        mapping: {
          useRecentSession: {
            '@path': '$.properties.useRecentSession'
          },
          sessionUrl: {
            '@path': '$.properties.sessionUrl'
          }
        }
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        event: {
          event_name: eventName,
          event_data: {
            firstproperty_str: properties['first-property'],
            second_property_str: properties.second_property,
            thirdProperty_str: properties.thirdProperty,
            useRecentSession_bool: properties.useRecentSession,
            sessionUrl_str: properties.sessionUrl
          },
          timestamp,
          use_recent_session: properties.useRecentSession,
          session_url: properties.sessionUrl
        }
      })
    })

    it('handles undefined event values', async () => {
      nock(baseUrl)
        .post(`/users/v1/individual/${urlEncodedUserId}/customevent?${integrationSourceQueryParam}`)
        .reply(200)
      const eventName = 'test-event'

      const event = createTestEvent({
        type: 'track',
        userId,
        event: eventName,
        timestamp: undefined
      })

      const [response] = await testDestination.testAction('trackEvent', {
        settings,
        event,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        event: {
          event_name: eventName,
          event_data: {}
        }
      })
    })
  })

  describe('identifyUser', () => {
    it('makes expected request with default mappings', async () => {
      nock(baseUrl)
        .post(`/users/v1/individual/${urlEncodedUserId}/customvars?${integrationSourceQueryParam}`)
        .reply(200)
      const event = createTestEvent({
        type: 'identify',
        userId,
        anonymousId,
        traits: {
          email,
          name: displayName,
          'originally-hyphenated': 'some string',
          'originally spaced': true,
          typeSuffixed_bool: true,
          'originally.dotted': 1.23
        }
      })

      const [response] = await testDestination.testAction('identifyUser', {
        settings,
        event,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        segmentAnonymousId_str: anonymousId,
        email,
        // TODO(nate): In the future, see if we can eliminate duplicate email_str and name_str data based on mapping config.
        // This may not be possible given the perform action doesn't have access to the mapping config to conclude that e.g.
        // name has been mapped to displayName and thus name_str is not needed as a custom var.
        email_str: email,
        displayName,
        name_str: displayName,
        originallyHyphenated_str: 'some string',
        originallySpaced_bool: true,
        typeSuffixed_bool: true,
        originallyDotted_real: 1.23
      })
    })
  })

  describe('onDelete', () => {
    const falsyUserIds = ['', undefined, null]
    it('makes expected request given a valid user id', async () => {
      nock(baseUrl).delete(`/v2beta/users?uid=${urlEncodedUserId}`).reply(200)
      await expect(testDestination.onDelete!({ type: 'delete', userId }, settings)).resolves.not.toThrowError()
    })

    falsyUserIds.forEach((falsyUserId) => {
      it(`it throws PayloadValidationError given falsy user id ${falsyUserId}`, async () => {
        await expect(testDestination.onDelete!({ type: 'delete', userId: falsyUserId }, settings)).rejects.toThrowError(
          new PayloadValidationError('User Id is required for user deletion.')
        )
      })
    })
  })

  describe('identifyUserV2', () => {
    it('makes expected request with default mappings', async () => {
      nock(baseUrl).post(`/v2beta/users?${integrationSourceQueryParam}`).reply(200)
      const event = createTestEvent({
        type: 'identify',
        userId,
        anonymousId,
        traits: {
          email,
          name: displayName,
          'originally-hyphenated': 'some string',
          'originally spaced': true,
          'originally.dotted': 1.23,
          typeSuffixed_bool: true
        }
      })

      const [response] = await testDestination.testAction('identifyUserV2', {
        settings,
        event,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        uid: userId,
        email,
        display_name: displayName,
        properties: {
          email,
          name: displayName,
          segmentAnonymousId: anonymousId,
          originallyhyphenated: 'some string',
          originallyspaced: true,
          originallydotted: 1.23,
          typeSuffixed_bool: true
        }
      })
    })
  })

  describe('trackEventV2', () => {
    it('makes expected request with default mappings', async () => {
      nock(baseUrl).post(`/v2beta/events?${integrationSourceQueryParam}`).reply(200)
      const eventName = 'test-event'

      const sessionId = '12345:678'

      const properties = {
        'first-property': 'first-value',
        second_property: 'second_value',
        thirdProperty: 'thirdValue',
        useRecentSession: true,
        sessionUrl: `session/url/${encodeURIComponent(sessionId)}`
      }

      const timestamp = new Date(Date.UTC(2022, 1, 2, 3, 4, 5)).toISOString()

      const event = createTestEvent({
        type: 'track',
        userId,
        event: eventName,
        timestamp,
        properties
      })

      const [response] = await testDestination.testAction('trackEventV2', {
        settings,
        event,
        // Default mappings defined under fields in ../trackEventV2/index.ts
        useDefaultMappings: true,
        mapping: {
          useRecentSession: {
            '@path': '$.properties.useRecentSession'
          },
          sessionUrl: {
            '@path': '$.properties.sessionUrl'
          }
        }
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        name: eventName,
        properties: {
          firstproperty: 'first-value',
          second_property: 'second_value',
          thirdProperty: 'thirdValue',
          useRecentSession: true,
          sessionUrl: `session/url/${encodeURIComponent(sessionId)}`
        },
        user: {
          uid: userId
        },
        timestamp,
        session: {
          id: sessionId,
          use_most_recent: properties.useRecentSession
        }
      })
    })

    it('handles undefined event values', async () => {
      nock(baseUrl).post(`/v2beta/events?${integrationSourceQueryParam}`).reply(200)
      const eventName = 'test-event'

      const event = createTestEvent({
        type: 'track',
        userId,
        event: eventName,
        timestamp: undefined
      })

      const [response] = await testDestination.testAction('trackEventV2', {
        settings,
        event,
        useDefaultMappings: true
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.options.body as string)).toEqual({
        name: eventName,
        properties: {},
        user: {
          uid: userId
        }
      })
    })
  })
})
