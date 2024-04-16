import { PublishRequestEvent, sendEvent } from '../event'

describe('sendEvent()', () => {
  const settings = { collectorEndpoint: 'http://test.com', environment: 'dev', apiKey: 'testkey' }
  const contextUrl = 'http://test.com/context'
  const application = 'testapp'
  const agent = 'test-sdk'
  const event: PublishRequestEvent = {
    units: [],
    publishedAt: 0
  }

  it('should add the required headers', async () => {
    const request = jest.fn()

    await sendEvent(request, settings, event, agent, application)

    expect(request).toHaveBeenCalledWith(contextUrl, {
      method: 'put',
      headers: {
        'X-Agent': agent,
        'X-Application': application,
        'X-Application-Version': '0'
      },
      json: event
    })
  })

  it('should use segment for agent and skip application headers if empty', async () => {
    const request = jest.fn()

    await sendEvent(request, settings, event, undefined, '')

    expect(request).toHaveBeenCalledWith(contextUrl, {
      method: 'put',
      headers: {
        'X-Agent': 'segment'
      },
      json: event
    })
  })
})
