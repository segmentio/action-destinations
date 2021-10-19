import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination, { destination } from '../index'
import * as snippet from '../snippet'

describe('initialization', () => {
  const settings = {
    safariWebsitePushId: 'safari',
    allowCrawlerActivity: true,
    doNotLoadFontAwesome: true,
    enableLogging: true,
    localization: 'pt',
    minimumIntervalBetweenTriggerActionsInSeconds: 60,
    openInAppMessagesInNewTab: true,
    sessionTimeoutInSeconds: 60,
    requireExplicitInAppMessageDismissal: true,
    enableHtmlInAppMessages: true,
    devicePropertyWhitelist: ['foo', 'bar'],
    allowUserSuppliedJavascript: true,
    contentSecurityNonce: 'bar',
    endpoint: 'endpoint',
    sdkVersion: '3.3'
  }

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  test('can load braze', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
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
      ],
      ...settings
    })

    jest.spyOn(destination.actions.trackPurchase, 'perform')
    jest.spyOn(destination, 'initialize')
    jest.spyOn(snippet, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(snippet.initialize).toHaveBeenCalled()

    const ctx = await event.track?.(
      new Context({
        type: 'track',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(destination.actions.trackPurchase.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    const scripts = window.document.querySelectorAll('script')

    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://js.appboycdn.com/web-sdk/3.3/appboy.min.js"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })
})
