import { eventRequestParams } from '../request-params'

import { anonymousId, email, userId, baseUrl, createdAt, settings } from './usermaven.test'

describe('requestParams', () => {
  it('eventRequestParams', () => {
    const event = {
      user: {
        anonymous_id: anonymousId,
        id: userId,
        email,
        created_at: createdAt
      }
    }

    const { url, options } = eventRequestParams(settings, {
      ...event
    })

    expect(options.method).toBe('post')
    expect(options.headers!['Content-Type']).toBe('application/json')
    expect(url).toBe(`${baseUrl}/api/v1/event?token=${settings.api_key}`)
  })
})
