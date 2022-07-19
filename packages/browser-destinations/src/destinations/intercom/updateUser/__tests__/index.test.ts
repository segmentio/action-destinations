import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import intercomDestination, { destination } from '../../index'
import { convertDateToUnix } from '../../utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'updateUser',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "identify" or "page"',
    mapping: {
      user_id: { '@path': '$.userId' },
      custom_traits: { '@path': '$.traits' },
      name: { '@path': '$.traits.name' },
      first_name: { '@path': '$.traits.firstName' },
      last_name: { '@path': '$.traits.lastName' },
      email: { '@path': '$.traits.email' },
      phone: { '@path': '$.traits.phone' },
      unsubscribed_from_emails: { '@path': '$.traits.unsubscribedFromEmails' },
      created_at: { '@path': '$.traits.createdAt' },
      language_override: { '@path': '$.traits.languageOverride' },
      user_hash: { '@path': '$.context.Intercom.user_hash' },
      hide_default_launcher: { '@path': '$.context.Intercom.hideDefaultLauncher' },
      avatar: { image_url: { '@path': '$.traits.avatar.imageUrl' } },
      company: {
        company_id: { '@path': '$.traits.company.id' },
        name: { '@path': '$.traits.company.name' },
        plan: { '@path': '$.traits.company.plan' },
        monthly_spend: { '@path': '$.traits.company.monthlySpend' },
        created_at: { '@path': '$.traits.company.createdAt' },
        size: { '@path': '$.traits.company.size' },
        website: { '@path': '$.traits.company.website' },
        industry: { '@path': '$.traits.company.industry' },
        company_custom_traits: { '@path': '$.traits.company' }
      },
      companies: {
        '@arrayPath': [
          '$.traits.companies',
          {
            company_id: { '@path': '$.id' },
            name: { '@path': '$.name' },
            plan: { '@path': '$.plan' },
            monthly_spend: { '@path': '$.monthlySpend' },
            created_at: { '@path': '$.createdAt' },
            size: { '@path': '$.size' },
            website: { '@path': '$.website' },
            industry: { '@path': '$.industry' },
            company_custom_traits: { '@path': '$.' }
          }
        ]
      }
    }
  }
]

describe('Intercom.update (user)', () => {
  const settings = {
    appId: 'superSecretAppID',
    activator: '#IntercomDefaultWidget'
  }

  let mockIntercom: jest.Mock<any, any>
  let updateUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [updateUserPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    updateUser = updateUserPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await updateUser.load(Context.system(), {} as Analytics)
  })

  test('sends an id and traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        email: 'italo@gmail.com'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      email: 'italo@gmail.com'
    })
  })

  test('sends a user name', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        email: 'italo@gmail.com',
        name: 'italo ferreira'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      email: 'italo@gmail.com',
      name: 'italo ferreira'
    })
  })

  test('sets first and last as name', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        firstName: 'italo',
        lastName: 'ferreira'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      name: 'italo ferreira'
    })
  })

  test('set .firstName as .name if no .lastName', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        firstName: 'italo'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      name: 'italo'
    })
  })

  test('respects name over firstName & lastName', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        name: 'myname',
        firstName: 'italo',
        lastName: 'ferreira'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      name: 'myname'
    })
  })

  test('sends custom traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        shortboarder: true,
        team: 'red bull'
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      shortboarder: true,
      team: 'red bull'
    })
  })

  test('drops custom arrays or objects from traits ', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        phone: '0000000',
        dropMe: ['i', 'will', 'be', 'dropped'],
        objDrop: {
          foo: 'bar'
        },
        company: {
          id: 'twilio',
          dropMe: ['i', 'will', 'be', 'dropped'],
          objDrop: {
            foo: 'bar'
          }
        },
        companies: [
          {
            id: 'segment',
            dropMe: ['i', 'will', 'be', 'dropped'],
            objDrop: {
              foo: 'bar'
            }
          }
        ]
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      phone: '0000000',
      company: {
        company_id: 'twilio'
      },
      companies: [
        {
          company_id: 'segment'
        }
      ]
    })
  })

  test('converts dates', async () => {
    const date = new Date()
    const isoDate = date.toISOString()
    const unixDate = convertDateToUnix(isoDate)

    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        createdAt: isoDate,
        company: {
          id: 'twilio',
          createdAt: isoDate
        },
        companies: [
          {
            id: 'segment',
            createdAt: isoDate
          }
        ]
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      created_at: unixDate,
      company: {
        company_id: 'twilio',
        created_at: unixDate
      },
      companies: [
        {
          company_id: 'segment',
          created_at: unixDate
        }
      ]
    })
  })

  test('fills in `type=avatar` for the avatar object', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        avatar: {
          imageUrl: 'someurl'
        }
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      avatar: {
        image_url: 'someurl',
        type: 'avatar'
      }
    })
  })

  test('allows passing a user hash', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {},
      context: {
        Intercom: {
          user_hash: 'x'
        }
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      user_hash: 'x'
    })
  })
})

describe('Intercom.update (user) widget options', () => {
  const settings = {
    appId: 'superSecretAppID',
    activator: '#customWidget'
  }

  let mockIntercom: jest.Mock<any, any>
  let updateUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [updateUserPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    updateUser = updateUserPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await updateUser.load(Context.system(), {} as Analytics)
  })

  test('sets activator if activator is not #IntercomDefaultWidget', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {}
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      widget: {
        activator: '#customWidget'
      }
    })
  })

  test('should set hide_default_launcher if the setting is there', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {},
      context: {
        Intercom: {
          hideDefaultLauncher: true
        }
      }
    })

    await updateUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      hide_default_launcher: true,
      widget: {
        activator: '#customWidget'
      }
    })
  })
})
