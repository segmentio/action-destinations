import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../../'
import { DESTINATION_INTEGRATION_NAME } from '../../constants'

describe('ajs-integration', () => {
  describe('autocapture works as expected', () => {
    
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
      *  First event on the page with attribution values will be transmitted with set and set_once values
      */
      const updatedCtx = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_INTEGRATION_NAME]
      expect(ampIntegrationsObj).toEqual({
        autocapture_attribution: {
          enabled: true,
          set: {
            gbraid: "gbraid5678",
            gclid: "gclid1234",
            utm_campaign: "spring_sale",
            utm_content: "ad1",
            utm_medium: "cpc",
            utm_source: "google",
            utm_term: "running shoes",
          },
          set_once: {
            initial_dclid: "EMPTY",
            initial_fbclid: "EMPTY",
            initial_gbraid: "gbraid5678",
            initial_gclid: "gclid1234",
            initial_ko_clickid: "EMPTY",
            initial_li_fat_id: "EMPTY",
            initial_msclkid: "EMPTY",
            initial_referrer: "EMPTY",
            initial_referring_domain: "EMPTY",
            initial_rtd_cid: "EMPTY",
            initial_ttclid: "EMPTY",
            initial_twclid: "EMPTY",
            initial_utm_campaign: "spring_sale",
            initial_utm_content: "ad1",
            initial_utm_id: "EMPTY",
            initial_utm_medium: "cpc",
            initial_utm_source: "google",
            initial_utm_term: "running shoes",
            initial_wbraid: "EMPTY"
          },
          unset: {
            referrer: "-",
            referring_domain: "-",
            utm_id: "-",
            dclid: "-",
            fbclid: "-",
            wbraid: "-",
            ko_clickid: "-",
            li_fat_id: "-",
            msclkid: "-",
            rtd_cid: "-",
            ttclid: "-",
            twclid: "-"
          }
        }
      })

      /* 
      *  Second event on the same page with attribution values will be transmitted without set and set_once values
      */
      const updatedCtx1 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj1 = updatedCtx1?.event?.integrations[DESTINATION_INTEGRATION_NAME]
      expect(ampIntegrationsObj1).toEqual({
        autocapture_attribution: {
          enabled: true,
          set_once: {},
          set: {},
          unset: {}
        }
      })


      /* 
      *  A new URL should result in updated set and unset values being sent in the payload
      */
      Object.defineProperty(window, 'location', {
        value: {
          search: '?utm_source=email'
        },
        writable: true
      })

      const updatedCtx2 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj2 = updatedCtx2?.event?.integrations[DESTINATION_INTEGRATION_NAME]

      expect(ampIntegrationsObj2).toEqual(
        {
          autocapture_attribution: {
            enabled: true,
            set: {
              utm_source: "email",
            },
            set_once: {
              initial_dclid: "EMPTY",
              initial_fbclid: "EMPTY",
              initial_gbraid: "EMPTY",
              initial_gclid: "EMPTY",
              initial_ko_clickid: "EMPTY",
              initial_li_fat_id: "EMPTY",
              initial_msclkid: "EMPTY",
              initial_referrer:"EMPTY",
              initial_referring_domain: "EMPTY",
              initial_rtd_cid: "EMPTY",
              initial_ttclid: "EMPTY",
              initial_twclid: "EMPTY",
              initial_utm_campaign: "EMPTY",
              initial_utm_content: "EMPTY",
              initial_utm_id: "EMPTY",
              initial_utm_medium: "EMPTY",
              initial_utm_source: "email",
              initial_utm_term: "EMPTY",
              initial_wbraid: "EMPTY"
            },
            unset: {
              referrer: "-",
              referring_domain: "-",
              utm_medium: "-",
              utm_campaign: "-",
              utm_term: "-",
              utm_content: "-",
              utm_id: "-",
              dclid: "-",
              fbclid: "-",
              gbraid: "-",
              wbraid: "-",
              gclid: "-",
              ko_clickid: "-",
              li_fat_id: "-",
              msclkid: "-",
              rtd_cid: "-",
              ttclid: "-",
              twclid: "-"
            }
          }
        }
      )

      /* 
      *  Next a new page load happens which does not have any valid attribution values. No attribution values should be sent in the payload
      */
      Object.defineProperty(window, 'location', {
        value: {
          search: '?'
        },
        writable: true
      })

      const updatedCtx3 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj3 = updatedCtx3?.event?.integrations[DESTINATION_INTEGRATION_NAME]

      expect(ampIntegrationsObj3).toEqual(
        {
          autocapture_attribution: {
            enabled: true,
            set: {},
            set_once: {},
            unset: {}
          }
        }
      )


      /* 
      *  Then we test when there are non attreibution URL params - the last cached attribution values are passed correctly in the payload
      */
      Object.defineProperty(window, 'location', {
        value: {
          search: '?some_fake_non_attribution_param=12345'
        },
        writable: true
      })

      const updatedCtx4 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj4 = updatedCtx4?.event?.integrations[DESTINATION_INTEGRATION_NAME]

      expect(ampIntegrationsObj4).toEqual(
        {
          autocapture_attribution: {
            enabled: true,
            set: {},
            set_once: {},
            unset: {}
          }
        }
      )

      /* 
      *  Next we test with a completely new attribution parameter
      */
      Object.defineProperty(window, 'location', {
        value: {
          search: '?ttclid=uyiuyiuy'
        },
        writable: true
      })

      const updatedCtx5 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj5 = updatedCtx5?.event?.integrations[DESTINATION_INTEGRATION_NAME]

      expect(ampIntegrationsObj5).toEqual(
        {
          autocapture_attribution: {
            enabled: true,
            set: {
              ttclid: "uyiuyiuy"
            },
            set_once: {
              initial_dclid: "EMPTY",
              initial_fbclid: "EMPTY",
              initial_gbraid: "EMPTY",
              initial_gclid: "EMPTY",
              initial_ko_clickid: "EMPTY",
              initial_li_fat_id: "EMPTY",
              initial_msclkid: "EMPTY",
              initial_referrer: "EMPTY",
              initial_referring_domain: "EMPTY",
              initial_rtd_cid: "EMPTY",
              initial_ttclid: "uyiuyiuy",
              initial_twclid: "EMPTY",
              initial_utm_campaign: "EMPTY",
              initial_utm_content: "EMPTY",
              initial_utm_id: "EMPTY",
              initial_utm_medium: "EMPTY",
              initial_utm_source: "EMPTY",
              initial_utm_term: "EMPTY",
              initial_wbraid: "EMPTY"
            },
            unset: {
              referrer: "-",
              referring_domain: "-",
              utm_source: "-",
              utm_medium: "-",
              utm_campaign: "-",
              utm_term: "-",
              utm_content: "-",
              utm_id: "-",
              dclid: "-",
              fbclid: "-",
              gbraid: "-",
              wbraid: "-",
              gclid: "-",
              ko_clickid: "-",
              li_fat_id: "-",
              msclkid: "-",
              rtd_cid: "-",
              twclid: "-"
            }
          }
        }
      )

      /* 
      *  Next we test with a some attributes we've never seen before, referrer and referring_domain
      */
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://blah.com/path/page/hello/',
          search: '',
          protocol: 'https:'
        },
        writable: true
      })

      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://blah.com/path/page/hello/',
      })

      const updatedCtx6 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj6 = updatedCtx6?.event?.integrations[DESTINATION_INTEGRATION_NAME]

      expect(ampIntegrationsObj6).toEqual(
        {
          autocapture_attribution: {
            enabled: true,
            set: {
              referrer: "https://blah.com/path/page/hello/",
              referring_domain: "blah.com"
            },
            set_once: {
              initial_dclid: "EMPTY",
              initial_fbclid: "EMPTY",
              initial_gbraid: "EMPTY",
              initial_gclid: "EMPTY",
              initial_ko_clickid: "EMPTY",
              initial_li_fat_id: "EMPTY",
              initial_msclkid: "EMPTY",
              initial_referrer: "https://blah.com/path/page/hello/",
              initial_referring_domain: "blah.com",
              initial_rtd_cid: "EMPTY",
              initial_ttclid: "EMPTY",
              initial_twclid: "EMPTY",
              initial_utm_campaign: "EMPTY",
              initial_utm_content: "EMPTY",
              initial_utm_id: "EMPTY",
              initial_utm_medium: "EMPTY",
              initial_utm_source: "EMPTY",
              initial_utm_term: "EMPTY",
              initial_wbraid: "EMPTY"
            },
            unset: {
              utm_source: "-",
              utm_medium: "-",
              utm_campaign: "-",
              utm_term: "-",
              utm_content: "-",
              utm_id: "-",
              dclid: "-",
              fbclid: "-",
              gbraid: "-",
              wbraid: "-",
              gclid: "-",
              ko_clickid: "-",
              li_fat_id: "-",
              msclkid: "-",
              rtd_cid: "-",
              ttclid: "-",
              twclid: "-"
            }
          }
        }
      )
    })
  })
  describe('autocapture can be blocked as expected', () => {
    
    const example: Subscription[] = [
      {
        partnerAction: 'autocaptureAttribution',
        name: 'Autocapture Attribution Plugin',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {
          excludeReferrers: ["test.com", "sub.blah.com", "meh.blah.com"]
        }
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
    })

    test('should prevent attribution from blocked domain', async () => {
      await autocaptureAttributionPlugin.load(Context.system(), ajs)
      const ctx = new Context({
        type: 'track',
        event: 'Test Event',
        properties: {
          greeting: 'Yo!'
        }
      })

     /* 
      *  Page referrer is in the exclude list - no autocaptured attribution values should be sent.
      */
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://test.com/path/page/hello/',
          search: '',
          protocol: 'https:'
        },
        writable: true
      })

      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://test.com/path/page/hello/',
      })

      const updatedCtx = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj = updatedCtx?.event?.integrations[DESTINATION_INTEGRATION_NAME]
      expect(ampIntegrationsObj).toEqual({
        autocapture_attribution: {
          enabled: true,
          set: {},
          set_once: {},
          unset: {}
        }
      })

     /* 
      *  Same test as before but this time with a sub domain
      */
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://sub.blah.com/path/page/hello/',
          search: '',
          protocol: 'https:'
        },
        writable: true
      })

      Object.defineProperty(document, 'referrer', {
        writable: true,
        value: 'https://sub.blah.com/path/page/hello/',
      })

      const updatedCtx1 = await autocaptureAttributionPlugin.track?.(ctx)
      const ampIntegrationsObj1 = updatedCtx1?.event?.integrations[DESTINATION_INTEGRATION_NAME]
      expect(ampIntegrationsObj1).toEqual({
        autocapture_attribution: {
          enabled: true,
          set: {},
          set_once: {},
          unset: {}
        }
      })

    })
  })
})

