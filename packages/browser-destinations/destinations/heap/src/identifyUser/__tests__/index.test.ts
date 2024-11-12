import { Analytics, Context } from '@segment/analytics-next'
import {
  createMockedHeapJsSdk,
  HEAP_TEST_ENV_ID,
  identifyUserSubscription,
  mockHeapJsHttpRequest
} from '../../test-utilities'
import heapDestination from '../../index'

describe('#identify', () => {
  it('should not call identify if user id is not provided and anonymous user id is provided', async () => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

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
    window.heap = createMockedHeapJsSdk()

    const [identifyUser] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [identifyUserSubscription] })

    await identifyUser.load(Context.system(), {} as Analytics)
    const heapIdentifySpy = jest.spyOn(window.heap, 'identify')
    const heapAddUserPropertiesSpy = jest.spyOn(window.heap, 'addUserProperties')

    await identifyUser.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anon',
        userId: 'user@example.com'
      })
    )

    expect(heapIdentifySpy).toHaveBeenCalledWith('user@example.com')
    expect(heapAddUserPropertiesSpy).not.toHaveBeenCalled()
  })

  it('should call addUserProprties if traits are provided', async () => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

    const [identifyUser] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [identifyUserSubscription] })

    await identifyUser.load(Context.system(), {} as Analytics)
    const heapIdentifySpy = jest.spyOn(window.heap, 'identify')
    const heapAddUserPropertiesSpy = jest.spyOn(window.heap, 'addUserProperties')

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
    expect(heapAddUserPropertiesSpy).toHaveBeenCalledWith({ testProp: false })
  })
})
