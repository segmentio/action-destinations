import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DCS_BASE_URL } from '../../constants'
import { hashEventId } from '../../utils'

const testDestination = createTestIntegration(Destination)

const settings = { client_id: 'client-id', client_secret: 'client-secret' }
const auth = { accessToken: 'access-token', refreshToken: '' }

const connection = {
  imsOrgId: 'ORG123@AdobeOrg',
  sandboxName: 'prod',
  inletId: 'inlet-1',
  schemaRefId: 'https://ns.adobe.com/tenant/schemas/abc',
  schemaRefContentType: 'application/vnd.adobe.xed-full+json;version=1',
  datasetId: 'dataset-1',
  flowId: 'flow-1'
}

const timestamp = '2026-11-10T12:00:00.000Z'

const event = createTestEvent({
  type: 'track',
  event: 'Order Completed',
  messageId: 'msg-1',
  userId: 'user-42',
  anonymousId: 'anon-1',
  timestamp,
  context: { page: { url: 'https://example.com/checkout', referrer: 'https://example.com/cart' } },
  properties: { revenue: 99.5, tier: 'gold' }
})

const batchPath = `/collection/batch/${connection.inletId}`

describe('Adobe AEP - Send Event', () => {
  afterEach(() => nock.cleanAll())

  it('sends an ExperienceEvent to the batch endpoint with the expected envelope', async () => {
    let body: any
    nock(DCS_BASE_URL)
      .post(batchPath, (b) => {
        body = b
        return true
      })
      .matchHeader('x-sandbox-name', 'prod')
      .matchHeader('authorization', 'Bearer access-token')
      .matchHeader('x-api-key', 'client-id')
      .reply(207, { inletId: 'inlet-1', batchId: 'b1', responses: [{ xactionId: 'x1' }] })

    const responses = await testDestination.testAction('sendEvent', {
      event,
      settings,
      auth,
      useDefaultMappings: true,
      mapping: {
        ...connection,
        xdmMapping: {
          'commerce.order.priceTotal': { '@path': '$.properties.revenue' },
          '_experience.analytics.customDimensions.eVars.eVar5': { '@path': '$.properties.tier' },
          'web.webPageDetails.URL': { '@path': '$.context.page.url' }
        }
      }
    })

    expect(responses[0].status).toBe(207)
    expect(body.messages).toHaveLength(1)
    const [message] = body.messages
    const schemaRef = { id: connection.schemaRefId, contentType: connection.schemaRefContentType }
    expect(message.header).toEqual({
      schemaRef,
      imsOrgId: connection.imsOrgId,
      datasetId: connection.datasetId,
      flowId: connection.flowId
    })
    expect(message.body.xdmMeta).toEqual({ schemaRef })
    expect(message.body.xdmEntity).toEqual({
      _id: hashEventId('msg-1'),
      timestamp,
      identityMap: {
        PID: [{ id: 'user-42', primary: true }],
        ECID: [{ id: 'anon-1', primary: false }]
      },
      commerce: { order: { priceTotal: 99.5 } },
      _experience: { analytics: { customDimensions: { eVars: { eVar5: 'gold' } } } },
      web: { webPageDetails: { URL: 'https://example.com/checkout' } }
    })
  })

  it('makes a custom identity flagged primary the only primary identity', async () => {
    let body: any
    nock(DCS_BASE_URL)
      .post(batchPath, (b) => {
        body = b
        return true
      })
      .reply(207, { responses: [{ xactionId: 'x1' }] })

    await testDestination.testAction('sendEvent', {
      event,
      settings,
      auth,
      useDefaultMappings: true,
      mapping: {
        ...connection,
        customIdentities: [
          { namespace: 'ECI', value: 'eci-7', primary: true },
          { namespace: 'Email', value: '  ', primary: true }
        ]
      }
    })

    expect(body.messages[0].body.xdmEntity.identityMap).toEqual({
      ECI: [{ id: 'eci-7', primary: true }],
      PID: [{ id: 'user-42', primary: false }],
      ECID: [{ id: 'anon-1', primary: false }]
    })
  })

  it('makes ECID primary when it is the only identity', async () => {
    let body: any
    nock(DCS_BASE_URL)
      .post(batchPath, (b) => {
        body = b
        return true
      })
      .reply(207, { responses: [{ xactionId: 'x1' }] })

    await testDestination.testAction('sendEvent', {
      event: createTestEvent({ ...event, userId: null }),
      settings,
      auth,
      useDefaultMappings: true,
      mapping: connection
    })

    expect(body.messages[0].body.xdmEntity.identityMap).toEqual({ ECID: [{ id: 'anon-1', primary: true }] })
  })

  it('rejects an event with no identity without calling AEP', async () => {
    await expect(
      testDestination.testAction('sendEvent', {
        event: createTestEvent({ ...event, userId: null, anonymousId: null }),
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })
    ).rejects.toThrowError('The event has no identity')
    expect(nock.isDone()).toBe(true)
  })

  it('rejects prototype keys and conflicting paths in XDM Mapping', async () => {
    await expect(
      testDestination.testAction('sendEvent', {
        event,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { ...connection, xdmMapping: { '__proto__.polluted': 'yes' } }
      })
    ).rejects.toThrowError('is not allowed')

    await expect(
      testDestination.testAction('sendEvent', {
        event,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { ...connection, xdmMapping: { 'web.webPageDetails': 'x', 'web.webPageDetails.URL': 'y' } }
      })
    ).rejects.toThrowError('conflicts with another mapped path')

    await expect(
      testDestination.testAction('sendEvent', {
        event,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: { ...connection, xdmMapping: { 'identityMap.Email': 'x' } }
      })
    ).rejects.toThrowError('is set by this action')
  })

  it('throws an authentication error when AEP returns 403 so the token is refreshed', async () => {
    nock(DCS_BASE_URL).post(batchPath).reply(403, { title: 'Forbidden', detail: 'Invalid token' })

    await expect(
      testDestination.testAction('sendEvent', {
        event,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })
    ).rejects.toMatchObject({ status: 401 })
  })

  it('throws a retryable API error when AEP returns 503', async () => {
    nock(DCS_BASE_URL).post(batchPath).reply(503, { message: 'unavailable' })

    await expect(
      testDestination.testAction('sendEvent', {
        event,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })
    ).rejects.toMatchObject({ status: 503 })
  })

  describe('performBatch', () => {
    it('maps 207 results by index and reports local rejections without sending them', async () => {
      let body: any
      nock(DCS_BASE_URL)
        .post(batchPath, (b) => {
          body = b
          return true
        })
        .reply(207, {
          responses: [{ xactionId: 'x1' }, { statusCode: 400, message: 'Schema mismatch' }]
        })

      const events = [
        createTestEvent({ ...event, messageId: 'm1' }),
        createTestEvent({ ...event, messageId: 'm2', userId: null, anonymousId: null }),
        createTestEvent({ ...event, messageId: 'm3' })
      ]

      await testDestination.testBatchAction('sendEvent', {
        events,
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })

      expect(body.messages.map((m: any) => m.body.xdmEntity._id)).toEqual([hashEventId('m1'), hashEventId('m3')])

      const multistatus = testDestination.results[0].multistatus ?? []
      expect(multistatus).toHaveLength(3)
      expect(multistatus[0]).toMatchObject({ status: 200 })
      expect(multistatus[1]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED' })
      expect(multistatus[2]).toMatchObject({ status: 400 })
      expect((multistatus[2] as any).errormessage).toContain('Schema mismatch')
    })

    it('reports a request-level 403 as 401 for every event', async () => {
      // The first 401 triggers a token refresh and one retry; both attempts fail.
      nock('https://ims-na1.adobelogin.com').persist().post('/ims/token/v3').reply(200, {
        access_token: 'new-token',
        token_type: 'bearer',
        expires_in: 86399999
      })
      nock(DCS_BASE_URL).persist().post(batchPath).reply(403, { title: 'Forbidden' })

      await testDestination.testBatchAction('sendEvent', {
        events: [event, createTestEvent({ ...event, messageId: 'm2' })],
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })

      const multistatus = testDestination.results[0].multistatus ?? []
      expect(multistatus.map((r) => r.status)).toEqual([401, 401])
    })

    it('sends one request per inlet and sandbox', async () => {
      const first = nock(DCS_BASE_URL)
        .post('/collection/batch/inlet-1')
        .matchHeader('x-sandbox-name', 'prod')
        .reply(207, { responses: [{ xactionId: 'a' }] })
      const second = nock(DCS_BASE_URL)
        .post('/collection/batch/inlet-2')
        .matchHeader('x-sandbox-name', 'dev')
        .reply(207, { responses: [{ xactionId: 'b' }] })

      await testDestination.testBatchAction('sendEvent', {
        events: [
          createTestEvent({ ...event, properties: { inlet: 'inlet-1', sandbox: 'prod' } }),
          createTestEvent({ ...event, messageId: 'm2', properties: { inlet: 'inlet-2', sandbox: 'dev' } })
        ],
        settings,
        auth,
        useDefaultMappings: true,
        mapping: {
          ...connection,
          inletId: { '@path': '$.properties.inlet' },
          sandboxName: { '@path': '$.properties.sandbox' }
        }
      })

      expect(first.isDone()).toBe(true)
      expect(second.isDone()).toBe(true)
      const multistatus = testDestination.results[0].multistatus ?? []
      expect(multistatus.map((r) => r.status)).toEqual([200, 200])
    })
  })
})
