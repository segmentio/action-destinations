import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { trackUrl } from '../../index'
import { base64Decode } from '../../base64'
import { get } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const splitUrlRe = /^(\w+:\/\/[^/]+)(.*)/

describe('Friendbuy.trackCustomer', () => {
  test('all fields', async () => {
    const [_, trackSchemeAndHost, trackPath] = splitUrlRe.exec(trackUrl) || []

    nock(trackSchemeAndHost)
      .get(new RegExp('^' + trackPath))
      .reply(200, {})

    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const name = 'John Doe'
    const email = 'john.doe@example.com'
    const profile = 'JWT profile'
    const event = createTestEvent({
      userId,
      traits: {
        name,
        email
      },
      integrations: { 'Actions Friendbuy': { profile } as unknown as boolean },
      timestamp: '2021-10-05T15:30:35Z'
    })
    // console.log('test event', event)

    const r = await testDestination.testAction('trackCustomer', {
      event,
      settings: {
        merchantId
      },
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
      payload: expect.any(String),
      tracker: profile
    })
    const searchParams = r[0].options.searchParams as Record<string, string>

    const metadata = JSON.parse(base64Decode(searchParams.metadata))
    expect(metadata).toMatchObject({
      url: get(event.context, ['page', 'url']),
      title: get(event.context, ['page', 'title'])
    })

    // console.log(r[0].options.searchParams)
    const payload = JSON.parse(decodeURIComponent(base64Decode(searchParams.payload)))
    // console.log(payload)
    expect(payload).toMatchObject({
      customer: { id: userId, email, name }
    })
  })
})
