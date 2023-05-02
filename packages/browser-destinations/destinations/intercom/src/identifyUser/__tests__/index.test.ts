import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import intercomDestination, { destination } from '../../index'
import { convertDateToUnix } from '../../utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "identify" or "page"',
    mapping: {
      user_id: { '@path': '$.userId' },
      custom_traits: {
        major: {
          '@path': '$.traits.major'
        },
        school: {
          '@path': '$.traits.school'
        }
      },
      name: { '@path': '$.traits.name' },
      email: { '@path': '$.traits.email' },
      phone: { '@path': '$.traits.phone' },
      unsubscribed_from_emails: { '@path': '$.traits.unsubscribedFromEmails' },
      created_at: {
        '@if': {
          exists: { '@path': '$.traits.createdAt' },
          then: { '@path': '$.traits.createdAt' },
          else: { '@path': '$.traits.created_at' }
        }
      },
      language_override: { '@path': '$.traits.languageOverride' },
      user_hash: {
        '@if': {
          exists: { '@path': '$.context.Intercom.user_hash' },
          then: { '@path': '$.context.Intercom.user_hash' },
          else: { '@path': '$.context.Intercom.userHash' }
        }
      },
      hide_default_launcher: {
        '@if': {
          exists: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          then: { '@path': '$.context.Intercom.hideDefaultLauncher' },
          else: { '@path': '$.context.Intercom.hide_default_launcher' }
        }
      },
      avatar_image_url: { '@path': '$.traits.avatar' },
      company: {
        company_id: { '@path': '$.traits.company.id' },
        name: { '@path': '$.traits.company.name' },
        plan: { '@path': '$.traits.company.plan' },
        monthly_spend: { '@path': '$.traits.company.monthlySpend' },
        created_at: {
          '@if': {
            exists: { '@path': '$.traits.company.createdAt' },
            then: { '@path': '$.traits.company.createdAt' },
            else: { '@path': '$.traits.company.created_at' }
          }
        },
        size: { '@path': '$.traits.company.size' },
        website: { '@path': '$.traits.company.website' },
        industry: { '@path': '$.traits.company.industry' },
        company_custom_traits: {
          city: {
            '@path': '$.traits.company.city'
          },
          tech: {
            '@path': '$.traits.company.tech'
          }
        }
      },
      companies: {
        '@arrayPath': [
          '$.traits.companies',
          {
            company_id: { '@path': '$.id' },
            name: { '@path': '$.name' },
            plan: { '@path': '$.plan' },
            monthly_spend: { '@path': '$.monthlySpend' },
            created_at: {
              '@if': {
                exists: { '@path': '$.createdAt' },
                then: { '@path': '$.createdAt' },
                else: { '@path': '$.created_at' }
              }
            },
            size: { '@path': '$.size' },
            website: { '@path': '$.website' },
            industry: { '@path': '$.industry' },
            company_custom_traits: {
              city: {
                '@path': '$.city'
              },
              tech: {
                '@path': '$.tech'
              }
            }
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
  let identifyUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyUserPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    identifyUser = identifyUserPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  test('sends an id and traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        email: 'italo@gmail.com'
      }
    })

    await identifyUser.identify?.(context)

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

    await identifyUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      email: 'italo@gmail.com',
      name: 'italo ferreira'
    })
  })

  test('sends custom traits', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        shortboarder: true,
        major: 'cs'
      }
    })

    await identifyUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      major: 'cs'
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

    await identifyUser.identify?.(context)

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

    await identifyUser.identify?.(context)

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

  test('accepts camel/snake case for created_at', async () => {
    const date = new Date()
    const isoDate = date.toISOString()
    const unixDate = convertDateToUnix(isoDate)

    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        created_at: isoDate,
        company: {
          id: 'twilio',
          created_at: isoDate
        },
        companies: [
          {
            id: 'segment',
            created_at: isoDate
          }
        ]
      }
    })

    await identifyUser.identify?.(context)

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

  test('avatar works', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {
        avatar: 'someurl'
      }
    })

    await identifyUser.identify?.(context)

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

    await identifyUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      user_hash: 'x'
    })
  })

  test('accepts snake/camel case for user_hash', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {},
      context: {
        Intercom: {
          userHash: 'x'
        }
      }
    })

    await identifyUser.identify?.(context)

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
  let identifyUser: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [identifyUserPlugin] = await intercomDestination({
      ...settings,
      subscriptions
    })
    identifyUser = identifyUserPlugin

    mockIntercom = jest.fn()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      const mockedWithProps = Object.assign(mockIntercom as any, settings)
      return Promise.resolve(mockedWithProps)
    })
    await identifyUser.load(Context.system(), {} as Analytics)
  })

  test('sets activator if activator is not #IntercomDefaultWidget', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {}
    })

    await identifyUser.identify?.(context)

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

    await identifyUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      hide_default_launcher: true,
      widget: {
        activator: '#customWidget'
      }
    })
  })

  test('accepts snake/camel case for hide_default_launcher', async () => {
    const context = new Context({
      type: 'identify',
      userId: 'id',
      traits: {},
      context: {
        Intercom: {
          hide_default_launcher: true
        }
      }
    })

    await identifyUser.identify?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      hide_default_launcher: true,
      widget: {
        activator: '#customWidget'
      }
    })
  })
})
