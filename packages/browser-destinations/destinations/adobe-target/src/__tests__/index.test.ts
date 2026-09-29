import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core'

describe('Adobe Target Web', () => {
  test('can load ATJS', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'upsertProfile',
        name: 'Upsert Profile',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {}
      }
    ]
    const [event] = await adobeTarget({
      client_code: 'segmentexchangepartn',
      admin_number: '10',
      version: '2.8.0',
      cookie_domain: 'segment.com',
      mbox_name: 'target-global-mbox',
      subscriptions: subscriptions as unknown as JSONArray
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://admin10.testandtarget.omniture.com/admin/rest/v1/libraries/atjs/download?client=segmentexchangepartn&version=2.8.0"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })

  test('loads a self-hosted at.js from library_url when set, bypassing the Adobe download endpoint', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'upsertProfile',
        name: 'Upsert Profile',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {}
      }
    ]
    const [event] = await adobeTarget({
      client_code: 'segmentexchangepartn',
      admin_number: '10',
      version: '2.8.0',
      cookie_domain: 'segment.com',
      mbox_name: 'target-global-mbox',
      library_url: 'https://cdn.example.com/assets/at.js',
      subscriptions: subscriptions as unknown as JSONArray
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const loadedScript = window.document.querySelector('script[src]')
    expect(loadedScript?.getAttribute('src')).toBe('https://cdn.example.com/assets/at.js')
  })
})
