import { Analytics, Context } from '@segment/analytics-next'
import trackPageObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.trackPage', () => {
  const subscriptions: Subscription[] = [
    {
      partnerAction: 'trackPage',
      name: trackPageObject.title,
      enabled: true,
      subscribe: trackPageObject.defaultSubscription!,
      mapping: {}
    }
  ]

  test('pageview', async () => {
    const [trackPage] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    })

    expect(trackPage).toBeDefined()

    await trackPage.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    const context = new Context({type: 'page'})
    trackPage.page?.(context)

    expect(window.wisepops.q.push).toHaveBeenCalledWith(['pageview'])
  })
})
