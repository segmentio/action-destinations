import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../index'
import { Subscription } from '../../../lib/browser-destinations'

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
    jest.mock('../../../runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
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
