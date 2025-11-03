import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../../'
import { DESTINATION_INTEGRATION_NAME } from '../../constants'

const example: Subscription[] = [
  {
    partnerAction: 'autocaptureAttribution',
    name: 'Autocapture Attribution Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let autocaptureAttributionPlugin: Plugin
let ajs: Analytics

beforeAll(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  autocaptureAttributionPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  // window.localStorage.clear()

  Object.defineProperty(window, 'location', {
    value: {
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&utm_term=running+shoes&utm_content=ad1&gclid=gclid1234&gbraid=gbraid5678'
    },
    writable: true
  })
})

describe('ajs-integration', () => {
  test('updates the original event with with attributions values from the URL, caches the values, then updates when new values come along', async () => {
    await autocaptureAttributionPlugin.load(Context.system(), ajs)
    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })


    /* 
     *  First we test that the attributions from the URL are captured and added to the event
     */
    const updatedCtx = await autocaptureAttributionPlugin.track?.(ctx)
    const ampIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_INTEGRATION_NAME]
    expect(ampIntegrationsObj).toEqual(
      {
        autocapture_attribution: {
          new: {
            gbraid: "gbraid5678",
            gclid: "gclid1234",
            utm_campaign: "spring_sale",
            utm_content: "ad1",
            utm_medium: "cpc",
            utm_source: "google",
            utm_term: "running shoes",
          },
          old: {}
        }
      }
    )

    Object.defineProperty(window, 'location', {
      value: {
        search: '?utm_source=email'
      },
      writable: true
    })

    /* 
     *  Then we test that the new attributes from the URL are captured, the old cached values are retrieved
     */
    const updatedCtx2 = await autocaptureAttributionPlugin.track?.(ctx)
    const ampIntegrationsObj2 = updatedCtx2?.event?.integrations[DESTINATION_INTEGRATION_NAME]

    expect(ampIntegrationsObj2).toEqual(
      {
        autocapture_attribution: {
          new: {
            utm_source: "email"
          },
          old: {
            gbraid: "gbraid5678",
            gclid: "gclid1234",
            utm_campaign: "spring_sale",
            utm_content: "ad1",
            utm_medium: "cpc",
            utm_source: "google",
            utm_term: "running shoes",
          }
        }
      }
    )


    Object.defineProperty(window, 'location', {
      value: {
        search: '?'
      },
      writable: true
    })


    /* 
     *  Then we test when there are no new URL attribution values - the last cached attribution values are passed correctly in the payload
     */
    const updatedCtx3 = await autocaptureAttributionPlugin.track?.(ctx)
    const ampIntegrationsObj3 = updatedCtx3?.event?.integrations[DESTINATION_INTEGRATION_NAME]

    expect(ampIntegrationsObj3).toEqual(
      {
        autocapture_attribution: {
          new: {},
          old: {
            utm_source: "email"
          }
        }
      }
    )


    Object.defineProperty(window, 'location', {
      value: {
        search: '?some_fake_non_attribution_param=12345'
      },
      writable: true
    })

    /* 
     *  Then we test when there are non attreibution URL params - the last cached attribution values are passed correctly in the payload
     */
    const updatedCtx4 = await autocaptureAttributionPlugin.track?.(ctx)
    const ampIntegrationsObj4 = updatedCtx4?.event?.integrations[DESTINATION_INTEGRATION_NAME]

    expect(ampIntegrationsObj4).toEqual(
      {
        autocapture_attribution: {
          new: {},
          old: {
            utm_source: "email"
          }
        }
      }
    )

    Object.defineProperty(window, 'location', {
      value: {
        search: '?ttclid=uyiuyiuy'
      },
      writable: true
    })

    /* 
     *  Finally we test with a completely new attribution parameter
     */
    const updatedCtx5 = await autocaptureAttributionPlugin.track?.(ctx)
    const ampIntegrationsObj5 = updatedCtx5?.event?.integrations[DESTINATION_INTEGRATION_NAME]

    expect(ampIntegrationsObj5).toEqual(
      {
        autocapture_attribution: {
          new: {
             ttclid: "uyiuyiuy"
          },
          old: {
            utm_source: "email"
          }
        }
      }
    )

  })
})