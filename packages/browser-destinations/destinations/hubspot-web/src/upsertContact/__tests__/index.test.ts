import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
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
      },
      company: {
        '@path': '$.traits.company.name'
      },
      country: {
        '@path': '$.traits.address.country'
      },
      state: {
        '@path': '$.traits.address.state'
      },
      city: {
        '@path': '$.traits.address.city'
      },
      address: {
        '@path': '$.traits.address.street'
      },
      zip: {
        '@path': '$.traits.address.postalCode'
      }
    }
  }
]

describe('Hubspot.upsertContact', () => {
  const settings = {
    portalId: '1234',
    formatCustomBehavioralEventNames: true
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

  test('does not call Hubspot if there is no email', async () => {
    const context = new Context({
      type: 'identify',
      userId: '👻',
      traits: {
        friendly: true
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(0)
  })

  test('Identifies the user to Hubspot when email is present', async () => {
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

  test('populates company info from the traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'mike',
      traits: {
        friendly: false,
        email: 'mike_eh@lph.com',
        company: {
          id: '123',
          name: 'Los Pollos Hermanos',
          industry: 'Transportation',
          employee_count: 128,
          plan: 'startup'
        }
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(1)
    expect(mockHubspot.push).toHaveBeenCalledWith([
      'identify',
      { email: 'mike_eh@lph.com', id: 'mike', friendly: false, company: 'Los Pollos Hermanos' }
    ])
  })

  test('populates address info from the traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'mike',
      traits: {
        friendly: false,
        email: 'mike_eh@lph.com',
        address: {
          street: '6th St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94103',
          country: 'USA'
        }
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(1)
    expect(mockHubspot.push).toHaveBeenCalledWith([
      'identify',
      {
        email: 'mike_eh@lph.com',
        id: 'mike',
        friendly: false,
        address: '6th St',
        country: 'USA',
        state: 'CA',
        city: 'San Francisco',
        zip: '94103'
      }
    ])
  })

  test('flattens nested traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'mike',
      traits: {
        friendly: false,
        email: 'mike_eh@lph.com',
        address: {
          street: '6th St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94103',
          country: 'USA'
        },
        equipment: {
          type: '🚘',
          color: 'red',
          make: {
            make: 'Tesla',
            model: 'Model S',
            year: 2019
          }
        }
      }
    })

    await upsertContactEvent.identify?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(1)
    expect(mockHubspot.push).toHaveBeenCalledWith([
      'identify',
      {
        email: 'mike_eh@lph.com',
        id: 'mike',
        friendly: false,
        address: '6th St',
        country: 'USA',
        state: 'CA',
        city: 'San Francisco',
        zip: '94103',
        equipment_type: '🚘',
        equipment_color: 'red',
        equipment_make_make: 'Tesla',
        equipment_make_model: 'Model S',
        equipment_make_year: 2019
      }
    ])
  })
})
