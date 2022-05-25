import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { defaultMapiBaseUrl } from '../../cloudUtil'
import { nockAuth, authKey, authSecret } from '../../__tests__/cloudUtil.mock'

const testDestination = createTestIntegration(Destination)

describe('Friendbuy.trackCustomer', () => {
  function setUpTest() {
    nockAuth()
    const nockRequests: any[] /* (typeof nock.ReplyFnContext.req)[] */ = []
    nock(defaultMapiBaseUrl)
      .post('/v1/customer')
      .reply(200, function (_uri, _requestBody) {
        nockRequests.push(this.req)
        return {}
      })
  }

  test('all fields', async () => {
    setUpTest()

    const userId = 'john-doe-12345'
    const email = 'john.doe@example.com'
    const isNewCustomer = false
    const customerSince = '2019-11-22T15:34:15Z'
    const loyaltyStatus = 'in'
    const firstName = 'John'
    const lastName = 'Doe'
    const gender = 'M'
    const age = 32
    const birthday = '1996-02-29'
    const language = 'en-US'
    const country = 'US'
    const state = 'CA'
    const city = 'Beverly Hills'
    const zipCode = '90210'
    const anonymousId = '0eba5e40-ceae-4ab5-870f-675c83869fff'
    const favoriteColor = 'red'
    const event = createTestEvent({
      type: 'identify',
      userId,
      anonymousId,
      traits: {
        email,
        isNewCustomer,
        customerSince,
        loyaltyStatus,
        firstName,
        lastName,
        gender,
        age,
        birthday,
        language,
        address: { country, state, city, postalCode: zipCode },
        friendbuyAttributes: {
          favoriteColor
        }
      },
      timestamp: '2021-10-05T15:30:35Z'
    })

    const r = await testDestination.testAction('trackCustomer', {
      event,
      settings: { authKey, authSecret },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(2) // auth request + trackCustomer request
    expect(r[1].options.json).toEqual({
      customerId: userId,
      email,
      isNewCustomer,
      loyaltyStatus,
      firstName,
      lastName,
      age,
      birthday: { year: 1996, month: 2, day: 29 },
      language,
      country,
      state,
      city,
      zipCode,
      ipAddress: event?.context?.ip,
      userAgent: event?.context?.userAgent,
      additionalProperties: {
        anonymousId,
        customerSince,
        favoriteColor
      }
    })
  })

  test('enjoined fields', async () => {
    setUpTest()

    const email = 'test@example.com'

    const event = createTestEvent({
      type: 'identify',
      userId: 98765 as unknown as string,
      traits: {
        email,
        age: '99',
        address: { postalCode: 99999 }
      },
      timestamp: '2021-10-05T15:30:35Z'
    })

    const r = await testDestination.testAction('trackCustomer', {
      event,
      settings: { authKey, authSecret },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(1) // (no auth request +) trackCustomer request
    expect(r[0].options.json).toMatchObject({
      customerId: '98765',
      email,
      age: 99,
      zipCode: '99999'
    })
  })
})
