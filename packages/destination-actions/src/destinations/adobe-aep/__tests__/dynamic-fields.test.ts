import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { IDENTITY_NAMESPACES_URL } from '../constants'

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
