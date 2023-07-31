import { Analytics, Context } from '@segment/analytics-next'
import wisepopsDestination, { destination } from '../index'
import { Subscription } from '../../../lib/browser-destinations'
import nock from 'nock'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackPage',
    name: 'Track Page',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {}
  }
]

describe('Wisepops', () => {
  test('initialize Wisepops with a website hash', async () => {
    const startTime = Date.now();
    jest.spyOn(destination, 'initialize')
    nock('https://loader.wisepops.com').get('/get-loader.js?plugin=segment&v=1&site=1234567890').reply(200, {})

    const [event] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.wisepops.q).toEqual([['options', {autoPageview: false}]]);
    expect(window.wisepops.l).toBeGreaterThanOrEqual(startTime);
    expect(window.wisepops.l).toBeLessThanOrEqual(Date.now());

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://loader.wisepops.com/get-loader.js?plugin=segment&v=1&site=1234567890"
          status="loading"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })
})
