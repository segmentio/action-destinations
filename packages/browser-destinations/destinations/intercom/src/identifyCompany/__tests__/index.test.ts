import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import intercomDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyCompany',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "group"',
    mapping: {
      company: {
        company_id: { '@path': '$.groupId' },
        company_custom_traits: {
          city: {
            '@path': '$.traits.city'
          },
          tech: {
            '@path': '$.traits.tech'
          }
        },
        name: { '@path': '$.traits.name' },
        plan: { '@path': '$.traits.plan' },
        monthly_spend: { '@path': '$.traits.monthlySpend' },
        created_at: {
          '@if': {
            exists: { '@path': '$.traits.createdAt' },
            then: { '@path': '$.traits.createdAt' },
            else: { '@path': '$.traits.created_at' }
          }
        },
        size: { '@path': '$.traits.size' },
        website: { '@path': '$.traits.website' },
        industry: { '@path': '$.traits.industry' }
      },
      hide_default_launcher: {
        '@if': {
          exists: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          then: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          else: { '@path': '$.context.Intercom.hide_default_launcher' }
        }
      }
    }
  }
]

describe('Intercom.update (Company)', () => {
  const settings = {
    appId: 'superSecretAppID',
    activator: '#IntercomDefaultWidget'
  }

  let mockIntercom: jest.Mock<any, any>
  let identifyCompany: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyCompanyPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    identifyCompany = identifyCompanyPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await identifyCompany.load(Context.system(), {} as Analytics)
  })

  test('sends an id', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id'
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id'
      }
    })
  })

  test('sends an id & properties', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        name: 'Jeff'
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        name: 'Jeff'
      }
    })
  })

  test('converts created_at from ISO-8601 to Unix', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        createdAt: '2018-01-23T22:28:55.111Z'
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        created_at: 1516746535
      }
    })
  })

  test('maps created_at properly regardless of it being sent in snake_case or camelCase', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        created_at: '2018-01-23T22:28:55.111Z'
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        created_at: 1516746535
      }
    })
  })

  test('sends custom traits', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        wave: 'Capitola',
        city: 'SF',
        tech: true
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        city: 'SF',
        tech: true
      }
    })
  })

  test('drops arrays or objects in traits', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        badArray: ['i', 'shall', 'be', 'dropped'],
        badObject: {
          rip: 'i will cease to exist'
        },
        city: 'Belmar'
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        city: 'Belmar'
      }
    })
  })

  test('should set hide_default_launcher if the setting is there', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        name: 'Segment'
      },
      context: {
        Intercom: {
          hideDefaultLauncher: true
        }
      }
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        name: 'Segment'
      },
      hide_default_launcher: true
    })
  })
})

describe('Intercom.update (user) widget options', () => {
  const settings = {
    appId: 'superSecretAppID',
    activator: '#customWidget'
  }

  let mockIntercom: jest.Mock<any, any>
  let identifyCompany: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyCompanyPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    identifyCompany = identifyCompanyPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await identifyCompany.load(Context.system(), {} as Analytics)
  })

  test('sets activator if activator is not #IntercomDefaultWidget', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {}
    })

    await identifyCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id'
      },
      widget: {
        activator: '#customWidget'
      }
    })
  })

  test('should set hide_default_launcher if the setting is there', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {},
      context: {
        Intercom: {
          hideDefaultLauncher: false
        }
      }
    })

    await identifyCompany.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id'
      },
      hide_default_launcher: false,
      widget: {
        activator: '#customWidget'
      }
    })
  })

  test('maps hide_default_launcher correctly regardless of it being sent in snake_case or camelCase', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {},
      context: {
        Intercom: {
          hideDefaultLauncher: false
        }
      }
    })

    await identifyCompany.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id'
      },
      hide_default_launcher: false,
      widget: {
        activator: '#customWidget'
      }
    })
  })
})
