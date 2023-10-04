import { Analytics, Context } from '@segment/analytics-next'
import UserMotionDestination from '../../index'

import { mockedSdk, TEST_API_KEY, pageviewSubscription } from '../../testIUtils'

beforeEach(async () => {
  window.usermotion = mockedSdk()
})

describe('UserMotion.pageview', () => {
  test('should call pageview', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [pageviewSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'pageview')

    await event.page?.(
      new Context({
        type: 'page'
      })
    )

    expect(umock).toHaveBeenCalled()
    // expect(umock).toHaveBeenCalledWith('1453', { email: 'n.amirali@gmail.com' })
  })

  test('should call pageview with properties', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [pageviewSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'pageview')

    await event.page?.(
      new Context({
        type: 'page',
        properties: {
          url: 'https://www.segment.com'
        }
      })
    )

    expect(umock).toHaveBeenCalledWith({ url: 'https://www.segment.com' })
  })
})
