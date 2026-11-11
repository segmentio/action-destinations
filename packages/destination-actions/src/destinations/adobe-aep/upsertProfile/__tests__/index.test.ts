import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DCS_BASE_URL } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = { client_id: 'client-id', client_secret: 'client-secret' }
const auth = { accessToken: 'access-token', refreshToken: '' }

const connection = {
  imsOrgId: 'ORG123@AdobeOrg',
  sandboxName: 'prod',
  inletId: 'profile-inlet',
  schemaRefId: 'https://ns.adobe.com/tenant/schemas/profile',
  schemaRefContentType: 'application/vnd.adobe.xed-full+json;version=1',
  datasetId: 'profile-dataset',
  flowId: 'flow-2'
}

const event = createTestEvent({
  type: 'identify',
  userId: 'user-42',
  anonymousId: 'anon-1',
  traits: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', tier: 'gold' }
})

const batchPath = `/collection/batch/${connection.inletId}`

describe('Adobe AEP - Upsert Profile', () => {
  afterEach(() => nock.cleanAll())

  it('sends an Individual Profile record with default trait mappings and no _id or timestamp', async () => {
    let body: any
    nock(DCS_BASE_URL)
      .post(batchPath, (b) => {
        body = b
        return true
      })
      .matchHeader('x-sandbox-name', 'prod')
      .reply(207, { responses: [{ xactionId: 'x1' }] })

    const responses = await testDestination.testAction('upsertProfile', {
      event,
      settings,
      auth,
      useDefaultMappings: true,
      mapping: connection
    })

    expect(responses[0].status).toBe(207)
    const [message] = body.messages
    expect(message.header.datasetId).toBe('profile-dataset')
    expect(message.header.source).toBeUndefined()
    expect(message.body.xdmEntity).toEqual({
      identityMap: {
        PID: [{ id: 'user-42', primary: true }],
        ECID: [{ id: 'anon-1', primary: false }]
      },
      person: { name: { firstName: 'Ada', lastName: 'Lovelace' } },
      personalEmail: { address: 'ada@example.com' }
    })
  })

  it('writes tenant fields from XDM Mapping', async () => {
    let body: any
    nock(DCS_BASE_URL)
      .post(batchPath, (b) => {
        body = b
        return true
      })
      .reply(207, { responses: [{ xactionId: 'x1' }] })

    await testDestination.testAction('upsertProfile', {
      event,
      settings,
      auth,
      useDefaultMappings: true,
      mapping: { ...connection, xdmMapping: { '_tenant.customerTier': { '@path': '$.traits.tier' } } }
    })

    expect(body.messages[0].body.xdmEntity._tenant).toEqual({ customerTier: 'gold' })
  })

  it('rejects a profile with no identity', async () => {
    await expect(
      testDestination.testAction('upsertProfile', {
        event: createTestEvent({ ...event, userId: null, anonymousId: null }),
        settings,
        auth,
        useDefaultMappings: true,
        mapping: connection
      })
    ).rejects.toThrowError('The event has no identity')
  })

  it('reports per-record failures in a batch', async () => {
    nock(DCS_BASE_URL)
      .post(batchPath)
      .reply(207, { responses: [{ xactionId: 'x1' }, { statusCode: 500, message: 'Processing error' }] })

    await testDestination.testBatchAction('upsertProfile', {
      events: [event, createTestEvent({ ...event, userId: 'user-43' })],
      settings,
      auth,
      useDefaultMappings: true,
      mapping: connection
    })

    const multistatus = testDestination.results[0].multistatus ?? []
    expect(multistatus.map((r) => r.status)).toEqual([200, 500])
  })
})
