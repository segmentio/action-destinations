import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from 'src/lib/browser-destinations'
import intercomDestination, { destination } from '../../index'

const settings = {
  appId: 'superSecretAppID',
  activator: '#IntercomDefaultWidget'
}

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

    await updateUser.group?.(context)

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

    await updateUser.group?.(context)

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
        team: 'red bull'
      }
    })

    await updateUser.group?.(context)

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
        }
      }
    })

    await updateUser.group?.(context)

    expect(mockIntercom).toHaveBeenCalledWith('update', {
      user_id: 'id',
      phone: '0000000'
    })
  })
})
