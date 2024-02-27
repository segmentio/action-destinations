import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'track',
    name: 'Track',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      }
    }
  }
]

describe('Screeb initialization', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
    jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
      resolveWhen: (_fn: any, _timeout: any) => {}
    }))
  })
  test('can load Screeb', async () => {
    const [event] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window.$screeb.q).toStrictEqual([['init', 'fake-website-id']])
  })
})
