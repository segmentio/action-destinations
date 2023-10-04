import { Analytics, Context } from '@segment/analytics-next'
import UserMotionDestination from '../../index'

import { mockedSdk, TEST_API_KEY, trackSubscription } from '../../testIUtils'

beforeEach(async () => {
  window.usermotion = mockedSdk()
})

describe('UserMotion.track', () => {
  test('should call track if event name is provided', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [trackSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'track')

    await event.track?.(
      new Context({
        type: 'track',
        name: 'TestEvent',
        properties: {
          email: 'n.amirali@gmail.com'
        }
      })
    )

    expect(umock).toHaveBeenCalledWith('TestEvent', { email: 'n.amirali@gmail.com' })
  })

  test('should not call track if event name is not provided', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [trackSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'track')

    await event.track?.(
      new Context({
        type: 'track',
        name: '',
        properties: {
          email: 'n.amirali@gmail.com'
        }
      })
    )

    expect(umock).not.toHaveBeenCalled()
  })
})
