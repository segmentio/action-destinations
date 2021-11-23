import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { trackUrl } from '../../index'
import { base64Decode } from '../../base64'
import { get } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const splitUrlRe = /^(\w+:\/\/[^/]+)(.*)/

describe('Friendbuy.trackCustomEvent', () => {
  test('all fields', async () => {
    const [_, trackSchemeAndHost, trackPath] = splitUrlRe.exec(trackUrl) || []

    nock(trackSchemeAndHost)
      .persist()
      .get(new RegExp('^' + trackPath))
      .reply(200, {})

    const merchantId = 'e1affd55-42fa-4bf5-a148-b93a34dfba60'
    const userId = 'john-doe-1234'

    const doTest = async (_testName: string, eventProps: Record<string, any>, expectedPayload: any) => {
      const event = createTestEvent({
        type: 'track',
        event: 'Download',
        ...eventProps
      })

      const r = await testDestination.testAction('trackCustomEvent', {
        event,
        settings: { merchantId },
        useDefaultMappings: true
        // mapping,
        // auth,
      })

      // console.log(_testName, JSON.stringify(r, null, 2))
      expect(r.length).toBe(1)
      expect(r[0].options.searchParams).toMatchObject({
        type: 'Download',
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
      // console.log('payload', _testName, JSON.stringify(payload, null, 2))
      expect(payload).toMatchObject(expectedPayload)
    }

    await doTest(
      'download events are sent',
      {
        userId,
        properties: {
          type: 'application',
          fileId: 'MyApp',
          deduplicationId: '1234'
        }
      },
      {
        type: 'application',
        fileId: 'MyApp',
        deduplicationId: '1234',
        customer: { id: userId }
      }
    )

    const anonymousId = '960efa33-6d3b-4eb9-a4e7-d95412d9829e'
    const email = 'john.doe@example.com'
    const firstName = 'John'
    const lastName = 'Doe'

    await doTest(
      'customer is sent if fields present',
      {
        userId,
        anonymousId,
        properties: {
          type: 'video',
          fileId: 'video-1234',
          email,
          firstName,
          lastName
        }
      },
      {
        type: 'video',
        fileId: 'video-1234',
        customer: { id: userId, anonymousId, email, firstName, lastName, name: `${firstName} ${lastName}` }
      }
    )
  })
})
