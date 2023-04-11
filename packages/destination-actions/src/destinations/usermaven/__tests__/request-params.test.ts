import { identifyUserRequestParams, trackEventRequestParams } from '../request-params'

import { anonymousId, email, userId, baseUrl, createdAt, settings } from './usermaven.test'

describe('requestParams', () => {
  it('identifyUserRequestParams', () => {
    const { url, options } = identifyUserRequestParams(settings, {
      userId,
      email,
      createdAt,
      anonymousId
    })
    expect(options.method).toBe('post')
    expect(options.headers!['Content-Type']).toBe('application/json')
    expect(options.headers!['X-Auth-Token']).toBe(`${settings.apiKey}.${settings.serverToken}`)
    expect(url).toBe(`${baseUrl}/api/v1/s2s/event?token=${settings.apiKey}.${settings.serverToken}`)
    expect(options.json).toEqual({
      api_key: settings.apiKey,
      event_id: '',
      event_type: 'user_identify',
      ids: {},
      user: {
        anonymous_id: anonymousId,
        id: userId,
        email,
        created_at: createdAt
      },
      screen_resolution: '0',
      src: 'usermaven-segment'
    })
  })

  it('trackEventRequestParams', () => {
    const { url, options } = trackEventRequestParams(settings, userId, 'Test Event')
    expect(options.method).toBe('post')
    expect(options.headers!['Content-Type']).toBe('application/json')
    expect(options.headers!['X-Auth-Token']).toBe(`${settings.apiKey}.${settings.serverToken}`)
    expect(url).toBe(`${baseUrl}/api/v1/s2s/event?token=${settings.apiKey}.${settings.serverToken}`)
    expect(options.json).toEqual({
      api_key: settings.apiKey,
      event_id: '',
      event_type: 'Test Event',
      ids: {},
      user: {
        id: userId
      },
      screen_resolution: '0',
      src: 'usermaven-segment',
      event_attributes: {}
    })
  })
})
