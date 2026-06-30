import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import MoengageDestination, { destination } from '../../index'
import { MoengageSDK } from '../../types'

describe('Moengage.identifyUser', () => {
  const settings = {
    appId: 'test_app_id',
    env: 'TEST',
    moeDataCenter: 'dc_1'
  }

  let mockMoengage: MoengageSDK
  let identifyUserAction: any

  beforeEach(async () => {
    jest.restoreAllMocks()

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockMoengage = {
        trackEvent: jest.fn(),
        setUserAttribute: jest.fn(),
        setFirstName: jest.fn(),
        setLastName: jest.fn(),
        setEmailId: jest.fn(),
        setMobileNumber: jest.fn(),
        setUserName: jest.fn(),
        setGender: jest.fn(),
        setBirthDate: jest.fn(),
        logoutUser: jest.fn(),
        callWebPush: jest.fn(),
        identifyUser: jest.fn(),
        getUserIdentities: jest.fn(),
        onsite: jest.fn()
      }
      return Promise.resolve(mockMoengage)
    })
  })

  test('identifyUser() with single user_id', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' }
          },
          attributes: {
            first_name: { '@path': '$.traits.first_name' },
            last_name: { '@path': '$.traits.last_name' },
            email: { '@path': '$.traits.email' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-123',
      traits: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith('user-123')
    expect(mockMoengage.setFirstName).toHaveBeenCalledWith('John')
    expect(mockMoengage.setLastName).toHaveBeenCalledWith('Doe')
    expect(mockMoengage.setEmailId).toHaveBeenCalledWith('john.doe@example.com')
  })

  test('identifyUser() with multiple identifiers', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' },
            email: { '@path': '$.traits.email' },
            mobile: { '@path': '$.traits.phone' }
          },
          attributes: {
            first_name: { '@path': '$.traits.first_name' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-456',
      traits: {
        email: 'jane@example.com',
        phone: '+1234567890',
        first_name: 'Jane'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith({
      user_id: 'user-456',
      email: 'jane@example.com',
      mobile: '+1234567890'
    })
    expect(mockMoengage.setFirstName).toHaveBeenCalledWith('Jane')
  })

  test('identifyUser() filters out non-string identifiers', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' },
            email: { '@path': '$.traits.email' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-789',
      traits: {
        email: 'test@example.com'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith({
      user_id: 'user-789',
      email: 'test@example.com'
    })
  })

  test('identifyUser() with all user attributes', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' }
          },
          attributes: {
            first_name: { '@path': '$.traits.first_name' },
            last_name: { '@path': '$.traits.last_name' },
            email: { '@path': '$.traits.email' },
            mobile: { '@path': '$.traits.phone' },
            username: { '@path': '$.traits.username' },
            gender: { '@path': '$.traits.gender' },
            birthday: { '@path': '$.traits.birthday' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-complete',
      traits: {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        phone: '+1234567890',
        username: 'alice_smith',
        gender: 'female',
        birthday: '1990-05-15'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith('user-complete')
    expect(mockMoengage.setFirstName).toHaveBeenCalledWith('Alice')
    expect(mockMoengage.setLastName).toHaveBeenCalledWith('Smith')
    expect(mockMoengage.setEmailId).toHaveBeenCalledWith('alice@example.com')
    expect(mockMoengage.setMobileNumber).toHaveBeenCalledWith('+1234567890')
    expect(mockMoengage.setUserName).toHaveBeenCalledWith('alice_smith')
    expect(mockMoengage.setGender).toHaveBeenCalledWith('female')
    expect(mockMoengage.setBirthDate).toHaveBeenCalledWith(expect.any(Date))
  })

  test('identifyUser() with custom attributes', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' }
          },
          attributes: {
            first_name: { '@path': '$.traits.first_name' },
            custom_field_1: { '@path': '$.traits.custom_field_1' },
            custom_field_2: { '@path': '$.traits.custom_field_2' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-custom',
      traits: {
        first_name: 'Bob',
        custom_field_1: 'value1',
        custom_field_2: 123
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith('user-custom')
    expect(mockMoengage.setFirstName).toHaveBeenCalledWith('Bob')
    expect(mockMoengage.setUserAttribute).toHaveBeenCalledWith('custom_field_1', 'value1')
    expect(mockMoengage.setUserAttribute).toHaveBeenCalledWith('custom_field_2', 123)
  })

  test('identifyUser() handles invalid birthday gracefully', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          identifiers: {
            user_id: { '@path': '$.userId' }
          },
          attributes: {
            birthday: { '@path': '$.traits.birthday' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      userId: 'user-invalid-bday',
      traits: {
        birthday: 'invalid-date'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).toHaveBeenCalledWith('user-invalid-bday')
    expect(mockMoengage.setBirthDate).not.toHaveBeenCalled()
  })

  test('identifyUser() does not call identifyUser when no identifiers provided', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'identifyUser',
        name: 'Identify User',
        enabled: true,
        subscribe: 'type = "identify"',
        mapping: {
          attributes: {
            first_name: { '@path': '$.traits.first_name' }
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-test-message-id',
      type: 'identify',
      traits: {
        first_name: 'Charlie'
      }
    })

    const [identifyUser] = await MoengageDestination({
      ...settings,
      subscriptions
    })
    identifyUserAction = identifyUser

    await identifyUserAction.load(Context.system(), {} as Analytics)
    await identifyUserAction.identify?.(context)

    expect(mockMoengage.identifyUser).not.toHaveBeenCalled()
    expect(mockMoengage.setFirstName).toHaveBeenCalledWith('Charlie')
  })
})
