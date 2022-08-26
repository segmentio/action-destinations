import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import hubspotDestination, { destination } from '../../index'
import { Hubspot } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackCustomBehavioralEvent',
    name: 'Track Custom Behavioral Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Hubspot.trackCustomBehavioralEvent', () => {
  const settings = {
    portalId: '1234'
  }

  let mockHubspot: Hubspot
  let trackCustomBehavioralEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackCustomBehavioralEventPlugin] = await hubspotDestination({
      ...settings,
      subscriptions
    })
    trackCustomBehavioralEvent = trackCustomBehavioralEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockHubspot = {
        push: jest.fn()
      }
      return Promise.resolve(mockHubspot)
    })
    await trackCustomBehavioralEvent.load(Context.system(), {} as Analytics)
  })

  test('maps custom traits correctly', async () => {
    const context = new Context({
      type: 'track',
      event: 'purchased a 🍱',
      properties: {
        type: '🍣',
        price: '$12.00',
        currency: 'USD'
      }
    })
    await trackCustomBehavioralEvent.track?.(context)

    expect(mockHubspot.push).toHaveBeenCalledWith([
      'trackCustomBehavioralEvent',
      { name: 'purchased a 🍱', properties: { currency: 'USD', price: '$12.00', type: '🍣' } }
    ])
  })
})
