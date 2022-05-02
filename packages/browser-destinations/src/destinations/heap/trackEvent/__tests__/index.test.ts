import { Analytics, Context } from '@segment/analytics-next'
import heapDestination from '../../index'
import {
  createMockedHeapJsSdk,
  HEAP_TEST_ENV_ID,
  mockHeapJsHttpRequest,
  trackEventSubscription
} from '../../test-utilities'

describe('#trackEvent', () => {
  it('sends events to heap', async () => {
    mockHeapJsHttpRequest()
    window.heap = createMockedHeapJsSdk()

    const [event] = await heapDestination({ appId: HEAP_TEST_ENV_ID, subscriptions: [trackEventSubscription] })

    await event.load(Context.system(), {} as Analytics)
    const heapTrackSpy = jest.spyOn(window.heap, 'track')

    await event.track?.(
      new Context({
        type: 'track',
        name: 'hello!',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(heapTrackSpy).toHaveBeenCalledWith(
      'hello!',
      {
        banana: '📞'
      },
      'segment'
    )
  })
})
