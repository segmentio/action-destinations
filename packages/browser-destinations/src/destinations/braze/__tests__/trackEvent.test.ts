import appboy from '@braze/web-sdk'
import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import brazeDestination from '../index'

describe('trackEvent', () => {
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

    const jsd = new jsdom.JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://segment.com'
    })

    const windowSpy = jest.spyOn(window, 'window', 'get')
    windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)

    // we're not really testing that appboy loads here, so we'll just mock it out
    jest.spyOn(appboy, 'initialize').mockImplementation(() => true)
    jest.spyOn(appboy, 'openSession').mockImplementation(() => true)
  })

  test('changes the external_id when present', async () => {
    const customEvent = jest.spyOn(appboy, 'logCustomEvent').mockReturnValue(true)

    const [trackEvent] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.3',
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Log Custom Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: {
              '@path': '$.event'
            },
            eventProperties: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    await trackEvent.load(Context.system(), {} as Analytics)
    await trackEvent.track?.(
      new Context({
        type: 'track',
        event: 'UFC',
        properties: {
          goat: 'hasbulla'
        }
      })
    )

    expect(customEvent).toHaveBeenCalledWith('UFC', { goat: 'hasbulla' })
  })
})
