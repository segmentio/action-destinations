import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { trackUrl } from '../../cloudUtil'
import { base64Decode } from '../../base64'
import { get } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const splitUrlRe = /^(\w+:\/\/[^/]+)(.*)/

describe('Friendbuy.trackSignUp', () => {
  test('all fields', async () => {
    const [_, trackSchemeAndHost, trackPath] = splitUrlRe.exec(trackUrl) || []

    nock(trackSchemeAndHost)
      .get(new RegExp('^' + trackPath))
      .reply(200, {})

    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const anonymousId = '6afc2ff2-cf54-414f-9a99-b3adb054ae31'
    const firstName = 'John'
    const lastName = 'Doe'
    const name = `${firstName} ${lastName}`
    const email = 'john.doe@example.com'
    const age = 42
    const loyaltyStatus = 'in'
    const friendbuyAttributes = { custom1: 'custom1', custom2: 'custom2', birthday: '2001-05-01' }

    const event = createTestEvent({
      type: 'track',
      event: 'Signed Up',
      userId,
      anonymousId,
      properties: {
        first_name: firstName,
        last_name: lastName,
        name,
        email,
        age,
        loyaltyStatus,
        friendbuyAttributes
      },
      timestamp: '2021-11-23T11:29Z'
    })

    const r = await testDestination.testAction('trackSignUp', {
      event,
      settings: { merchantId },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(1)
    expect(r[0].options.searchParams).toMatchObject({
      type: 'sign_up',
      merchantId,
      metadata: expect.any(String),
      payload: expect.any(String)
    })
    const searchParams = r[0].options.searchParams as Record<string, string>

    const metadata = JSON.parse(base64Decode(searchParams.metadata))
    // console.log("metadata", metadata)
    expect(metadata).toMatchObject({
      url: get(event.context, ['page', 'url']),
      title: get(event.context, ['page', 'title']),
      ipAddress: get(event.context, ['ip'])
    })

    const payload = JSON.parse(decodeURIComponent(base64Decode(searchParams.payload)))
    // console.log("payload", JSON.stringify(payload, null, 2))
    expect(payload).toMatchObject({
      customer: {
        id: userId,
        email,
        firstName,
        lastName,
        name,
        age,
        loyaltyStatus,
        anonymousId,
        ...friendbuyAttributes,
        birthday: { year: 2001, month: 5, day: 1 }
      }
    })
  })
})
