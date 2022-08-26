import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import hubspotDestination, { destination } from '../../index'
import { Hubspot } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'upsertContact',
    name: 'Upsert Contact',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      email: {
        '@path': '$.traits.email'
      },
      custom_properties: {
        '@path': '$.traits'
      },
      id: {
        '@path': '$.userId'
      }
    }
  }
]

describe('Hubspot.trackPageView', () => {
  const settings = {
    portalId: '1234'
  }

  let mockHubspot: Hubspot
  let upsertContactEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [upsertContactEventPlugin] = await hubspotDestination({
      ...settings,
      subscriptions
    })
    upsertContactEvent = upsertContactEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockHubspot = {
        push: jest.fn()
      }
      return Promise.resolve(mockHubspot)
    })
    await upsertContactEvent.load(Context.system(), {} as Analytics)
  })

  test('does not call Hubspot if there is no email or id', async () => {
    const context = new Context({
      type: 'identify',
      anonymousId: '👻',
      traits: {
        friendly: true
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(0)
  })

  test('Identifies the user to Hubspot using when both email and id are present', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'real_hubspot_tester',
      traits: {
        friendly: false,
        email: 'real_hubspot_tester@jest_experts.com'
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(1)
    expect(mockHubspot.push).toHaveBeenCalledWith([
      'identify',
      { email: 'real_hubspot_tester@jest_experts.com', id: 'real_hubspot_tester', friendly: false }
    ])
  })
})
