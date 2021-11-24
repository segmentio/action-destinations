import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { trackUrl } from '../../cloudUtil'
import { base64Decode } from '../../base64'
import { get } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const splitUrlRe = /^(\w+:\/\/[^/]+)(.*)/

describe('Friendbuy.trackCustomer', () => {
  test('all fields', async () => {
    const [_, trackSchemeAndHost, trackPath] = splitUrlRe.exec(trackUrl) || []

    const nockRequests: any[] /* (typeof nock.ReplyFnContext.req)[] */ = []
    nock(trackSchemeAndHost)
      .get(new RegExp('^' + trackPath))
      .reply(200, function (_uri, _requestBody) {
        nockRequests.push(this.req)
        return {}
      })

    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const firstName = 'John'
    const lastName = 'Doe'
    const email = 'john.doe@example.com'
    const age = 32
    const customerSince = '2019-11-22T15:34:15Z'
    const loyaltyStatus = 'in'
    const isNewCustomer = false
    const anonymousId = '0eba5e40-ceae-4ab5-870f-675c83869fff'
    // const profile = 'JWT profile'
    const event = createTestEvent({
      type: 'identify',
      userId,
      anonymousId,
      traits: {
        firstName,
        lastName,
        email,
        age,
        customerSince,
        loyaltyStatus,
        isNewCustomer
      },
      // integrations: { 'Actions Friendbuy': { profile } as unknown as boolean },
      timestamp: '2021-10-05T15:30:35Z'
    })

    const r = await testDestination.testAction('trackCustomer', {
      event,
      settings: { merchantId },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(1)
    expect(r[0].options.searchParams).toMatchObject({
      type: 'customer',
      merchantId,
      metadata: expect.any(String),
      payload: expect.any(String)
      // tracker: profile
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
    expect(payload).toMatchObject({
      customer: {
        id: userId,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        age,
        customerSince,
        loyaltyStatus,
        isNewCustomer
      }
    })

    const headerValue = (hdr: string) => stringify(nockRequests[0].headers[hdr])
    expect(headerValue('user-agent')).toBe(get(event.context, 'userAgent'))
    expect(headerValue('referer')).toBe(get(event.context, ['page', 'url']))
    expect(headerValue('x-forwarded-for')).toBe(get(event.context, ['ip']))
  })
})

function stringify(arg: string | string[]): string {
  return typeof arg === 'string' ? arg : arg.join()
}
