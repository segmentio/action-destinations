import { Analytics, Context } from '@segment/analytics-next'
import {
  createMocekdHeapJsSdk,
  HEAP_TEST_ENV_ID,
  identifyUserSubscription,
  mockHeapJsHttpRequest
} from '../../test-utilities'
import heapDestination from '../../index'

describe('#identify', () => {
  it('should not call identify if user id is not provided and anonymous user id is provided', async () => {
    mockHeapJsHttpRequest()
    window.heap = createMocekdHeapJsSdk()

    const [identifyUser] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [identifyUserSubscription] })

    await identifyUser.load(Context.system(), {} as Analytics)
    const heapIdentifySpy = jest.spyOn(window.heap, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon',
        traits: {
          testProp: false
        }
      })
    )

    expect(heapIdentifySpy).not.toHaveBeenCalled()
  })

  it('should call identify if user id is provided', async () => {
    mockHeapJsHttpRequest()
    window.heap = createMocekdHeapJsSdk()

    const [identifyUser] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [identifyUserSubscription] })

    await identifyUser.load(Context.system(), {} as Analytics)
    const heapIdentifySpy = jest.spyOn(window.heap, 'identify')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon',
        userId: 'user@example.com',
        traits: {
          testProp: false
        }
      })
    )

    expect(heapIdentifySpy).toHaveBeenCalledWith('user@example.com')
  })
})
