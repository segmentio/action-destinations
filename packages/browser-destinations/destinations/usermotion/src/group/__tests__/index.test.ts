import { Analytics, Context } from '@segment/analytics-next'
import UserMotionDestination from '../../index'

import { mockedSdk, groupSubscription, TEST_API_KEY } from '../../testIUtils'

beforeEach(async () => {
  window.usermotion = mockedSdk()
})

describe('UserMotion.group', () => {
  test('should call group if groupId is provided', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [groupSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'group')

    await event.group?.(
      new Context({
        type: 'group',
        groupId: '1453',
        traits: {
          email: 'n.amirali@gmail.com'
        }
      })
    )

    expect(umock).toHaveBeenCalledWith('1453', { email: 'n.amirali@gmail.com' })
  })

  test('should not call group if groupId is not provided', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [groupSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'group')

    await event.group?.(
      new Context({
        type: 'group'
      })
    )

    expect(umock).not.toHaveBeenCalled()
  })

  test('should not send traits if its not an object', async () => {
    const [event] = await UserMotionDestination({
      subscriptions: [groupSubscription],
      apiKey: TEST_API_KEY
    })

    await event.load(Context.system(), {} as Analytics)
    const umock = jest.spyOn(window.usermotion, 'group')

    await event.group?.(
      new Context({
        type: 'group',
        groupId: '1453',
        traits: () => {
          1
        }
      })
    )

    expect(umock).toHaveBeenCalledWith('1453', undefined)
  })
})
