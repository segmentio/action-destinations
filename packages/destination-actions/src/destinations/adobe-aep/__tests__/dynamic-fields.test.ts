import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { IDENTITY_NAMESPACES_URL, IMS_TOKEN_URL, SCHEMA_REGISTRY_URL } from '../constants'
import { clearDynamicFieldCaches } from '../dynamic-fields'

const testDestination = createTestIntegration(Definition)
const settings = { client_id: 'client-id', client_secret: 'client-secret' }
const auth = { accessToken: 'access-token', refreshToken: '' }

const url = new URL(IDENTITY_NAMESPACES_URL)

const namespaces = [
  { code: 'ECID', name: 'ECID', id: 4, idType: 'COOKIE', status: 'ACTIVE', custom: false },
  { code: 'Email', name: 'Email', id: 6, idType: 'EMAIL', status: 'ACTIVE', custom: false },
  { code: 'PID', name: 'Segment Person ID', id: 10031, idType: 'CROSS_DEVICE', status: 'ACTIVE', custom: true },
  { code: 'LoyaltyID', name: 'Loyalty ID', id: 10034, idType: 'CROSS_DEVICE', status: 'ACTIVE', custom: true },
  { code: 'CRMID', name: 'CRMID', id: 10032, idType: 'CROSS_DEVICE', status: 'ACTIVE', custom: true }
]

const connection = { imsOrgId: 'ORG123@AdobeOrg', sandboxName: 'prod' }

describe('Adobe AEP - dynamic fields', () => {
  beforeEach(() => clearDynamicFieldCaches())
  afterEach(() => nock.cleanAll())

  describe.each(['sendEvent', 'upsertProfile'])('%s', (action: string) => {
    describe('customIdentities namespace', () => {
      it('lists sandbox identity namespaces, custom first, without PID and ECID', async () => {
        nock(url.origin)
          .get(url.pathname)
          .matchHeader('authorization', 'Bearer access-token')
          .matchHeader('x-api-key', 'client-id')
          .matchHeader('x-gw-ims-org-id', 'ORG123@AdobeOrg')
          .matchHeader('x-sandbox-name', 'prod')
          .reply(200, namespaces)

        const response = await testDestination.testDynamicField(action, 'customIdentities.[0].namespace', {
          payload: connection,
          settings,
          auth
        })

        expect(response.error).toBeUndefined()
        expect(response.choices).toEqual([
          { label: 'CRMID', value: 'CRMID' },
          { label: 'LoyaltyID (Loyalty ID)', value: 'LoyaltyID' },
          { label: 'Email', value: 'Email' }
        ])
      })

      it('does not call Adobe until the org ID and sandbox are entered', async () => {
        const response = await testDestination.testDynamicField(action, 'customIdentities.[0].namespace', {
          payload: { imsOrgId: { '@path': '$.properties.org' }, sandboxName: 'prod' },
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('MISSING_CONNECTION_DETAILS')
        expect(nock.pendingMocks()).toEqual([])
      })

      it('returns an error, not a throw, when Adobe denies the request', async () => {
        nock(url.origin).get(url.pathname).reply(403, { error_code: '403027', message: 'User region is missing' })

        const response = await testDestination.testDynamicField(action, 'customIdentities.[0].namespace', {
          payload: connection,
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('403')
      })
    })

    describe('schemaRefId', () => {
      const registry = new URL(SCHEMA_REGISTRY_URL)
      const eventClass = 'https://ns.adobe.com/xdm/context/experienceevent'
      const profileClass = 'https://ns.adobe.com/xdm/context/profile'
      const schemas = {
        results: [
          {
            $id: 'https://ns.adobe.com/segmentexchange/schemas/d4c34af3',
            'meta:altId': '_segmentexchange.schemas.d4c34af3',
            version: '1.0',
            title: 'Testing Schema nikumar'
          },
          { $id: 'https://ns.adobe.com/segmentexchange/schemas/aaaa1111', version: '1.0', title: 'Web Events' }
        ],
        _page: { orderby: 'title', next: null, count: 2 }
      }

      it('lists schemas of the right class, saving the $id', async () => {
        const wanted = action === 'sendEvent' ? eventClass : profileClass
        nock(registry.origin)
          .get(registry.pathname)
          .query((q) => q.property === `meta:extends==${wanted}` && q.orderby === 'title')
          .matchHeader('authorization', 'Bearer access-token')
          .matchHeader('x-gw-ims-org-id', 'ORG123@AdobeOrg')
          .matchHeader('x-sandbox-name', 'prod')
          .matchHeader('accept', 'application/vnd.adobe.xed-id+json')
          .reply(200, schemas, { 'content-type': 'application/vnd.adobe.xed-id+json' })

        const response = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: connection,
          settings,
          auth
        })

        expect(response.error).toBeUndefined()
        expect(response.choices).toEqual([
          { label: 'Testing Schema nikumar', value: 'https://ns.adobe.com/segmentexchange/schemas/d4c34af3' },
          { label: 'Web Events', value: 'https://ns.adobe.com/segmentexchange/schemas/aaaa1111' }
        ])
      })

      it('does not call Adobe until the org ID and sandbox are entered', async () => {
        const response = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: { sandboxName: 'prod' },
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('MISSING_CONNECTION_DETAILS')
      })

      it('returns an error, not a throw, when Adobe denies the request', async () => {
        nock(registry.origin).get(registry.pathname).query(true).reply(403, {})

        const response = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: connection,
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('403')
      })
    })

    describe('xdmMapping keys', () => {
      const registry = new URL(SCHEMA_REGISTRY_URL)
      const schemaId = 'https://ns.adobe.com/segmentexchange/schemas/d4c34af3'
      const schema = {
        $id: schemaId,
        title: 'Testing Schema nikumar',
        properties: {
          _id: { title: 'Identifier', type: 'string', 'meta:xdmType': 'string' },
          eventMergeId: { title: 'ExperienceEvent merge ID', type: 'string', 'meta:xdmType': 'string' },
          identityMap: { type: 'object', 'meta:xdmType': 'map', additionalProperties: { type: 'array' } },
          producedBy: { title: 'Produced By', type: 'string', 'meta:xdmType': 'string' },
          timestamp: { title: 'Timestamp', type: 'string', 'meta:xdmType': 'date-time' },
          person: {
            type: 'object',
            'meta:xdmType': 'object',
            properties: {
              name: {
                type: 'object',
                'meta:xdmType': 'object',
                properties: { firstName: { title: 'First name', type: 'string', 'meta:xdmType': 'string' } }
              }
            }
          },
          productListItems: {
            title: 'Product list items',
            type: 'array',
            'meta:xdmType': 'array',
            items: { type: 'object', properties: { SKU: { type: 'string' } } }
          },
          customMap: { type: 'object', 'meta:xdmType': 'map', additionalProperties: { type: 'string' } }
        }
      }

      const mockSchema = () =>
        nock(registry.origin)
          .get(`${registry.pathname}/${encodeURIComponent(schemaId)}`)
          .matchHeader('authorization', 'Bearer access-token')
          .matchHeader('x-gw-ims-org-id', 'ORG123@AdobeOrg')
          .matchHeader('x-sandbox-name', 'prod')
          .matchHeader('accept', 'application/vnd.adobe.xed-full-notext+json;version=1')
          .reply(200, schema, { 'content-type': 'application/vnd.adobe.xed-full-notext+json;version=1' })

      it('lists the dotted paths in the schema, without the paths the action sets itself', async () => {
        mockSchema()

        const response = await testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
          payload: { ...connection, schemaRefId: schemaId },
          settings,
          auth
        })

        expect(response.error).toBeUndefined()
        const paths = response.choices.map((c) => c.value)
        // Arrays and maps are offered whole: an element or map key can't be addressed by a dotted path.
        const expected = ['customMap', 'eventMergeId', 'person.name.firstName', 'producedBy', 'productListItems']
        if (action === 'sendEvent') {
          expect(paths).toEqual(expected)
        } else {
          // Only `identityMap` is reserved for profiles; `_id` and `timestamp` are ordinary profile paths.
          expect(paths).toEqual(['_id', ...expected, 'timestamp'])
        }
        expect(response.choices.find((c) => c.value === 'customMap')).toEqual({
          label: 'customMap',
          value: 'customMap',
          description: 'map'
        })
      })

      it('reads a schema from Adobe once, then serves repeat opens from the cache', async () => {
        mockSchema() // a single reply: a second Adobe call would fail the test

        const open = () =>
          testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
            payload: { ...connection, schemaRefId: schemaId },
            settings,
            auth
          })
        const first = await open()
        const second = await open()

        expect(first.error).toBeUndefined()
        expect(second.choices).toEqual(first.choices)
        expect(nock.isDone()).toBe(true)
      })

      it('shares one Adobe call between overlapping opens, so a retry reuses an abandoned load', async () => {
        mockSchema()

        const open = () =>
          testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
            payload: { ...connection, schemaRefId: schemaId },
            settings,
            auth
          })
        const [a, b] = await Promise.all([open(), open()])

        expect(a.error).toBeUndefined()
        expect(b.choices).toEqual(a.choices)
      })

      it('does not cache a failed load', async () => {
        nock(registry.origin)
          .get(`${registry.pathname}/${encodeURIComponent(schemaId)}`)
          .reply(500, {})
        mockSchema()

        const open = () =>
          testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
            payload: { ...connection, schemaRefId: schemaId },
            settings,
            auth
          })
        const failed = await open()
        const retried = await open()

        expect(failed.error).toBeDefined()
        expect(retried.error).toBeUndefined()
        expect(retried.choices.length).toBeGreaterThan(0)
      })

      it('does not share cached paths between credentials', async () => {
        mockSchema()
        mockSchema()

        const open = (client_id: string) =>
          testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
            payload: { ...connection, schemaRefId: schemaId },
            settings: { ...settings, client_id },
            auth
          })
        await open('client-a')
        await open('client-b')

        expect(nock.isDone()).toBe(true)
      })

      it('asks for a schema first', async () => {
        const response = await testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
          payload: connection,
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('SCHEMA_REQUIRED')
      })

      it('does not call Adobe until the org ID and sandbox are entered', async () => {
        const response = await testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
          payload: { schemaRefId: schemaId },
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('MISSING_CONNECTION_DETAILS')
      })

      it('returns an error, not a throw, when Adobe denies the request', async () => {
        nock(registry.origin)
          .get(`${registry.pathname}/${encodeURIComponent(schemaId)}`)
          .reply(403, {})

        const response = await testDestination.testDynamicField(action, 'xdmMapping.__keys__', {
          payload: { ...connection, schemaRefId: schemaId },
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('403')
      })
    })

    describe('access token', () => {
      const ims = new URL(IMS_TOKEN_URL)
      const registry = new URL(SCHEMA_REGISTRY_URL)
      const results = { results: [{ $id: 'https://ns.adobe.com/t/schemas/1', title: 'One' }] }
      const choices = [{ label: 'One', value: 'https://ns.adobe.com/t/schemas/1' }]

      it('gets a token from the client credentials when none is supplied', async () => {
        nock(ims.origin).post(ims.pathname).reply(200, { access_token: 'minted-token' })
        nock(registry.origin)
          .get(registry.pathname)
          .query(true)
          .matchHeader('authorization', 'Bearer minted-token')
          .reply(200, results)

        const response = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: connection,
          settings
        })

        expect(response.error).toBeUndefined()
        expect(response.choices).toEqual(choices)
      })

      it('reuses a minted token for later calls', async () => {
        nock(ims.origin).post(ims.pathname).once().reply(200, { access_token: 'minted-token' })
        nock(registry.origin)
          .get(registry.pathname)
          .query(true)
          .times(2)
          .matchHeader('authorization', 'Bearer minted-token')
          .reply(200, results)

        await testDestination.testDynamicField(action, 'schemaRefId', { payload: connection, settings })
        const second = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: { ...connection, sandboxName: 'dev' },
          settings
        })

        expect(second.error).toBeUndefined()
        expect(nock.isDone()).toBe(true)
      })

      it('gets a new token and retries once when the supplied token is rejected', async () => {
        nock(registry.origin)
          .get(registry.pathname)
          .query(true)
          .matchHeader('authorization', 'Bearer access-token')
          .reply(401, {})
        nock(ims.origin).post(ims.pathname).reply(200, { access_token: 'new-token' })
        nock(registry.origin)
          .get(registry.pathname)
          .query(true)
          .matchHeader('authorization', 'Bearer new-token')
          .reply(200, results)

        const response = await testDestination.testDynamicField(action, 'schemaRefId', {
          payload: connection,
          settings,
          auth
        })

        expect(response.error).toBeUndefined()
        expect(response.choices).toEqual(choices)
      })
    })

    describe('primaryIdentity', () => {
      it('lists the identities mapped so far', async () => {
        const response = await testDestination.testDynamicField(action, 'primaryIdentity', {
          payload: {
            pid: { '@path': '$.userId' },
            customIdentities: [{ namespace: 'ECI' }, { namespace: '' }, { namespace: 'ECI' }]
          },
          settings,
          auth
        })

        expect(response.choices).toEqual([
          { label: 'PID', value: 'PID' },
          { label: 'ECI', value: 'ECI' }
        ])
      })

      it('asks for an identity to be mapped when none is', async () => {
        const response = await testDestination.testDynamicField(action, 'primaryIdentity', {
          payload: { ecid: '' },
          settings,
          auth
        })

        expect(response.choices).toEqual([])
        expect(response.error?.code).toBe('NO_IDENTITIES_MAPPED')
      })
    })
  })
})
