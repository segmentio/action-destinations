import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
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
    portalId: '1234',
    formatCustomBehavioralEventNames: true
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
      { name: 'pe1234_purchased_a_🍱', properties: { currency: 'USD', price: '$12.00', type: '🍣' } }
    ])
  })

  test('flattens nested object properties', async () => {
    const context = new Context({
      type: 'track',
      event: 'purchased a 🍱',
      properties: {
        type: '🍣',
        price: '$12.00',
        currency: 'USD',
        sides: {
          item1: '🧉',
          item2: '🧋',
          'auxilery Sauces': {
            'Soy Sauce': '🍶'
          }
        }
      }
    })
    await trackCustomBehavioralEvent.track?.(context)

    expect(mockHubspot.push).toHaveBeenCalledWith([
      'trackCustomBehavioralEvent',
      {
        name: 'pe1234_purchased_a_🍱',
        properties: {
          currency: 'USD',
          price: '$12.00',
          type: '🍣',
          sides_item1: '🧉',
          sides_item2: '🧋',
          sides_auxilery_sauces_soy_sauce: '🍶'
        }
      }
    ])
  })

  test('snake case spaces and dots', async () => {
    const context = new Context({
      type: 'track',
      event: 'purchased a 🍱',
      properties: {
        type: '🍣',
        price: '$12.00',
        currency: 'USD',
        'type of fish': '🐟',
        'brown.rice': false
      }
    })
    await trackCustomBehavioralEvent.track?.(context)

    expect(mockHubspot.push).toHaveBeenCalledWith([
      'trackCustomBehavioralEvent',
      {
        name: 'pe1234_purchased_a_🍱',
        properties: { currency: 'USD', price: '$12.00', type: '🍣', type_of_fish: '🐟', brown_rice: false }
      }
    ])
  })
})
