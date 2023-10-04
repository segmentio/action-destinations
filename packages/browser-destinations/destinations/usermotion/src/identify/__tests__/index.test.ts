import { Analytics, Context } from '@segment/analytics-next'
import UserMotionDestination from '../../index'

import { mockedSdk, identifySubscription, TEST_API_KEY } from '../../testIUtils'

beforeEach(async () => {
  window.usermotion = mockedSdk()
})

describe('UserMotion.identify', () => {
  test('should map userId and traits and pass them into UserMotion.identify', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [identifySubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'identify')

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: '1453',
        traits: {
          email: 'n.amirali@gmail.com'
        }
      })
    )

    expect(umock).toHaveBeenCalledWith('1453', { email: 'n.amirali@gmail.com' })
  })

  test('should not call identify if userId is not provided', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [identifySubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'identify')

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: null
      })
    )

    expect(umock).not.toHaveBeenCalled()
  })

  test('should not send traits if its not an object', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [identifySubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'identify')

    await event.identify?.(
      new Context({
        type: 'identify',
        userId: '1453',
        traits: () => {
          1
        }
      })
    )

    expect(umock).toHaveBeenCalledWith('1453', undefined)
  })
})
