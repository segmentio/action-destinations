import { Analytics, Context } from '@segment/analytics-next'
import heapDestination, { destination } from '../index'
import nock from 'nock'
import { HeapApi } from '../types'

describe('Heap', () => {
  const appId = 'fakeAppId'

  test('loading', async () => {
    const expectedHeap: HeapApi = [['appId', appId]] as any

    jest.spyOn(destination, 'initialize')

    nock('https://cdn.heapanalytics.com').get(`/js/heap-${appId}.js`).reply(200, {})

    const [event] = await heapDestination({ appId })

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window.heap).toEqual(expectedHeap)
  })
})
