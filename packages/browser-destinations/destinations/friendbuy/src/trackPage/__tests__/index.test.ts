import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackPageObject, { trackPageDefaultSubscription, trackPageFields } from '../index'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  // Prevent friendbuy.js and campaigns.js from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Friendbuy.trackPage', () => {
  const subscriptions = [
    {
      partnerAction: 'trackPage',
      name: trackPageObject.title,
      enabled: true,
      subscribe: trackPageDefaultSubscription,
      mapping: Object.fromEntries(Object.entries(trackPageFields).map(([name, value]) => [name, value.default]))
    }
  ]

  test('all fields', async () => {
    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const name = 'Page Name'
    const category = 'Page Category'
    const title = 'Page Title'

    const [trackPage] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    expect(trackPage).toBeDefined()

    await trackPage.load(Context.system(), {} as Analytics)

    jest.spyOn(window.friendbuyAPI as any, 'push')

    const context = new Context({
      type: 'page',
      name,
      category,
      properties: {
        title
      }
    })
    // console.log('context', JSON.stringify(context, null, 2))

    trackPage.page?.(context)

    // console.log('trackSignUp request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
    expect(window.friendbuyAPI?.push).toHaveBeenCalledWith([
      'track',
      'page',
      {
        name,
        category,
        title
      },
      true
    ])
  })
})
