import { Analytics, Context } from '@segment/analytics-next'
import heapDestination, { destination } from '../index'
import nock from 'nock'

const subscriptions = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

describe('Heap', () => {
  const appId = '1'

  test('loading', async () => {
    jest.spyOn(destination, 'initialize')

    nock('https://cdn.heapanalytics.com').get(`/js/heap-${appId}.js`).reply(200, {})

    const [event] = await heapDestination({ appId, subscriptions })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap.appid).toEqual(appId)
  })
})
