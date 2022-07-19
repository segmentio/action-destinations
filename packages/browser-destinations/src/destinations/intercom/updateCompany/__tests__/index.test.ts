import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import intercomDestination, { destination } from '../../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'updateCompany',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "group"',
    mapping: {
      company: {
        company_id: { '@path': '$.groupId' },
        company_custom_traits: { '@path': '$.traits' },
        name: { '@path': '$.traits.name' },
        plan: { '@path': '$.traits.plan' },
        monthly_spend: { '@path': '$.traits.monthlySpend' },
        created_at: { '@path': '$.traits.createdAt' },
        size: { '@path': '$.traits.size' },
        website: { '@path': '$.traits.website' },
        industry: { '@path': '$.traits.industry' }
      },
      hide_default_launcher: {
        '@path': '$.context.Intercom.hideDefaultLauncher'
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
  let updateCompany: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [updateCompanyPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    updateCompany = updateCompanyPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await updateCompany.load(Context.system(), {} as Analytics)
  })

  test('sends an id', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id'
    })

    await updateCompany.group?.(context)

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

    await updateCompany.group?.(context)

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

    await updateCompany.group?.(context)

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
        ft: 4,
        stoked: true
      }
    })

    await updateCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        wave: 'Capitola',
        ft: 4,
        stoked: true
      }
    })
  })

  test('drops arrays or objects in traits', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {
        monthlySpend: 123,
        badArray: ['i', 'shall', 'be', 'dropped'],
        badObject: {
          rip: 'i will cease to exist'
        },
        passMe: true
      }
    })

    await updateCompany.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      company: {
        company_id: 'id',
        monthly_spend: 123,
        passMe: true
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

    await updateCompany.group?.(context)

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
  let updateCompany: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [updateCompanyPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    updateCompany = updateCompanyPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await updateCompany.load(Context.system(), {} as Analytics)
  })

  test('sets activator if activator is not #IntercomDefaultWidget', async () => {
    const context = new Context({
      type: 'group',
      groupId: 'id',
      traits: {}
    })

    await updateCompany.group?.(context)

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

    await updateCompany.identify?.(context)

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
