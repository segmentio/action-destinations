import appboy from '@braze/web-sdk'
import { Analytics, Context } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import brazeDestination from '../index'

describe('updateUserProfile', () => {
  let userMock: appboy.User

  const subscriptions = [
    {
      partnerAction: 'updateUserProfile',
      name: 'Update User Profile',
      enabled: true,
      subscribe: 'type = "identify"',
      mapping: {
        country: { '@path': '$.traits.country' },
        current_location: { '@path': '$.traits.current_location' },
        custom_attributes: { '@path': '$.traits.custom_attributes' },
        dob: { '@path': '$.traits.dob' },
        email: { '@path': '$.traits.email' },
        email_subscribe: { '@path': '$.traits.email_subscribe' },
        first_name: { '@path': '$.traits.first_name' },
        gender: { '@path': '$.traits.gender' },
        home_city: { '@path': '$.traits.home_city' },
        image_url: { '@path': '$.traits.image_url' },
        language: { '@path': '$.traits.language' },
        last_name: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' },
        push_subscribe: { '@path': '$.traits.push_subscribe' }
      }
    }
  ]

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

    const jsd = new jsdom.JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://segment.com'
    })

    const windowSpy = jest.spyOn(window, 'window', 'get')
    windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)

    // we're not really testing that appboy loads here, so we'll just mock it out
    userMock = {
      setAvatarImageUrl: jest.fn(),
      setCountry: jest.fn(),
      setDateOfBirth: jest.fn(),
      setCustomUserAttribute: jest.fn(),
      setEmailNotificationSubscriptionType: jest.fn(),
      setEmail: jest.fn(),
      setFirstName: jest.fn(),
      setGender: jest.fn(),
      setLastName: jest.fn(),
      setHomeCity: jest.fn(),
      setLanguage: jest.fn(),
      setLastKnownLocation: jest.fn(),
      setPhoneNumber: jest.fn(),
      setPushNotificationSubscriptionType: jest.fn()
    } as unknown as appboy.User

    jest.spyOn(appboy, 'initialize').mockImplementation(() => true)
    jest.spyOn(appboy, 'openSession').mockImplementation(() => true)
    jest.spyOn(appboy, 'getUser').mockImplementation(() => userMock)
  })

  test('changes the external_id when present', async () => {
    const changeUser = jest.spyOn(appboy, 'changeUser').mockImplementationOnce(() => {})

    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions: [
        {
          partnerAction: 'updateUserProfile',
          name: 'Log User',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {
            external_id: {
              '@path': '$.traits.external_id'
            }
          }
        }
      ]
    })

    await trackPurchase.load(Context.system(), {} as Analytics)
    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          external_id: 'xt_123'
        }
      })
    )

    expect(changeUser).toHaveBeenCalledWith('xt_123')
  })

  test('can change user traits', async () => {
    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions
    })

    await trackPurchase.load(Context.system(), {} as Analytics)
    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          external_id: 'xt_123',
          country: 'BRA',
          current_location: {
            latitude: -23.54,
            longitude: -46.65
          },
          custom_attributes: {
            greeting: 'oi'
          },
          dob: '01/01/2000',
          email: 'foo@example.org',
          email_subscribe: true,
          first_name: 'Foo',
          gender: 'M',
          home_city: 'Miami',
          image_url: 'img_url',
          language: 'english',
          last_name: 'Bar',
          phone: '555 5555',
          push_subscribe: true
        }
      })
    )

    expect(userMock.setAvatarImageUrl).toHaveBeenCalledWith('img_url')
    expect(userMock.setCountry).toHaveBeenCalledWith('BRA')
    expect(userMock.setDateOfBirth).toHaveBeenCalledWith(2000, 1, 1)
    expect(userMock.setCustomUserAttribute).toHaveBeenCalledWith('greeting', 'oi')
    expect(userMock.setEmailNotificationSubscriptionType).toHaveBeenCalledWith(true)
    expect(userMock.setEmail).toHaveBeenCalledWith('foo@example.org')
    expect(userMock.setFirstName).toHaveBeenCalledWith('Foo')
    expect(userMock.setGender).toHaveBeenCalledWith('M')
    expect(userMock.setLastName).toHaveBeenCalledWith('Bar')
    expect(userMock.setHomeCity).toHaveBeenCalledWith('Miami')
    expect(userMock.setLanguage).toHaveBeenCalledWith('english')
    expect(userMock.setLastKnownLocation).toHaveBeenCalledWith(-23.54, -46.65)
    expect(userMock.setPhoneNumber).toHaveBeenCalledWith('555 5555')
    expect(userMock.setPushNotificationSubscriptionType).toHaveBeenCalledWith(true)
  })

  test('can set gender', async () => {
    const [trackPurchase] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      subscriptions
    })

    await trackPurchase.load(Context.system(), {} as Analytics)
    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          gender: 'Male'
        }
      })
    )

    expect(userMock.setGender).toHaveBeenCalledWith('M')

    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          gender: 'prefer not to say'
        }
      })
    )

    expect(userMock.setGender).toHaveBeenCalledWith('P')

    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          gender: 'not defined on mapping'
        }
      })
    )

    expect(userMock.setGender).toHaveBeenCalledWith('not defined on mapping')

    await trackPurchase.identify?.(
      new Context({
        type: 'identify',
        traits: {
          gender: null
        }
      })
    )

    expect(userMock.setGender).toHaveBeenCalledWith(null)
  })
})
