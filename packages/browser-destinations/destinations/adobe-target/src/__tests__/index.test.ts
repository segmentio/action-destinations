import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core'

// Mock the script loader so tests don't make real network requests (deterministic in CI).
const mockLoadScript = jest.fn().mockResolvedValue(undefined)
jest.mock('@segment/browser-destination-runtime/load-script', () => ({
  loadScript: (...args: unknown[]) => mockLoadScript(...args)
}))
jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
  resolveWhen: () => Promise.resolve()
}))

const subscriptions: Subscription[] = [
  {
    partnerAction: 'upsertProfile',
    name: 'Upsert Profile',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {}
  }
]

describe('Adobe Target Web', () => {
  beforeEach(() => {
    mockLoadScript.mockClear()
  })

  test('loads at.js from the Adobe admin download endpoint by default', async () => {
    const [event] = await adobeTarget({
      client_code: 'segmentexchangepartn',
      admin_number: '10',
      version: '2.8.0',
      cookie_domain: 'segment.com',
      mbox_name: 'target-global-mbox',
      subscriptions: subscriptions as unknown as JSONArray
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(mockLoadScript).toHaveBeenCalledWith(
      'https://admin10.testandtarget.omniture.com/admin/rest/v1/libraries/atjs/download?client=segmentexchangepartn&version=2.8.0'
    )
  })

  test('loads a self-hosted at.js from library_url when set, bypassing the Adobe download endpoint', async () => {
    const [event] = await adobeTarget({
      client_code: 'segmentexchangepartn',
      admin_number: '10',
      version: '2.8.0',
      cookie_domain: 'segment.com',
      mbox_name: 'target-global-mbox',
      library_url: 'https://cdn.example.com/assets/at.js',
      subscriptions: subscriptions as unknown as JSONArray
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(mockLoadScript).toHaveBeenCalledWith('https://cdn.example.com/assets/at.js')
    expect(mockLoadScript).not.toHaveBeenCalledWith(expect.stringContaining('testandtarget.omniture.com'))
  })
})
