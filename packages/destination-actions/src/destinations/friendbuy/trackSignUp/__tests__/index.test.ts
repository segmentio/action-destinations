import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { defaultMapiBaseUrl } from '../../cloudUtil'
import { nockAuth, authKey, authSecret } from '../../__tests__/cloudUtil.mock'

const testDestination = createTestIntegration(Destination)

describe('Friendbuy.trackSignUp', () => {
  function setUpTest() {
    nockAuth()
    nock(defaultMapiBaseUrl).post('/v1/event/account-sign-up').reply(200, {})
  }

  test('all fields', async () => {
    setUpTest()

    const userId = 'john-doe-12345'
    const anonymousId = '6afc2ff2-cf54-414f-9a99-b3adb054ae31'
    const firstName = 'John'
    const lastName = 'Doe'
    const name = `${firstName} ${lastName}`
    const email = 'john.doe@example.com'
    const isNewCustomer = true
    const loyaltyStatus = 'in'
    const age = 42
    const birthday = '2001-05-01'
    const couponCode = 'coupon-123'
    const attributionId = 'adc507d9-0ace-4ae3-a572-986d022645a0'
    const referralCode = 'ref12345'
    const friendbuyAttributes = { custom1: 'custom1', custom2: 'custom2' }

    const event = createTestEvent({
      type: 'track',
      event: 'Signed Up',
      userId,
      anonymousId,
      properties: {
        email,
        isNewCustomer,
        loyaltyStatus,
        coupon: couponCode,
        attributionId,
        referralCode,
        firstName,
        lastName,
        name,
        age,
        birthday,
        friendbuyAttributes
      },
      timestamp: '2021-11-23T11:29Z'
    })

    const r = await testDestination.testAction('trackSignUp', {
      event,
      settings: { authKey, authSecret },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(2) // auth request + trackSignUp request
    expect(r[1].options.json).toEqual({
      customerId: userId,
      email,
      isNewCustomer,
      loyaltyStatus,
      firstName,
      lastName,
      couponCode,
      attributionId,
      referralCode,
      age,
      birthday: { year: 2001, month: 5, day: 1 },
      ipAddress: event?.context?.ip,
      userAgent: event?.context?.userAgent,
      additionalProperties: {
        ...friendbuyAttributes,
        anonymousId,
        name
      }
    })
  })

  test('enjoined fields', async () => {
    setUpTest()

    const email = 'test@example.com'

    const event = createTestEvent({
      type: 'track',
      event: 'Signed Up',
      userId: 55555 as unknown as string,
      properties: {
        email,
        age: '77'
      },
      timestamp: '2021-11-23T11:29Z'
    })

    const r = await testDestination.testAction('trackSignUp', {
      event,
      settings: { authKey, authSecret },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(1) // (no auth request +) trackSignUp request
    expect(r[0].options.json).toMatchObject({
      customerId: '55555',
      email,
      age: 77
    })
  })
})
