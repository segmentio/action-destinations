import nock from 'nock'
import { createRequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { getDataExtensionFields, getDataExtensions, selectOrCreateDataExtension } from '../sfmc-operations'

const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}

const restUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com`
const dataExtensionId = '1234567890'

const mockToken = () =>
  nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`)
    .post('/v2/token')
    .reply(200, { access_token: 'test-access-token', soap_instance_url: 'https://soap.example.com' })

describe('Salesforce Marketing Cloud - error handling without a response', () => {
  const request = createRequestClient()

  beforeEach(() => {
    nock.cleanAll()
    mockToken()
  })

  afterAll(() => {
    nock.cleanAll()
  })

  describe('getDataExtensions (dataExtensionId dynamic field)', () => {
    it('returns the network error message when there is no response', async () => {
      nock(restUrl).get('/data/v1/customobjects').query(true).replyWithError('socket hang up')

      const response = await getDataExtensions(request, settings.subdomain, settings)

      expect(response.choices).toEqual([])
      expect(response.error?.code).toBe('BAD_REQUEST')
      expect(response.error?.message).toContain('socket hang up')
      expect(response.error?.message).not.toContain('Cannot read properties of undefined')
    })

    it('returns the timeout message when the request times out', async () => {
      nock(restUrl).get('/data/v1/customobjects').query(true).delay(200).reply(200, { count: 0, items: [] })

      const response = await getDataExtensions(createRequestClient({ timeout: 20 }), settings.subdomain, settings)

      expect(response.choices).toEqual([])
      expect(response.error).toEqual({ message: 'Request timed out after 20ms', code: 'BAD_REQUEST' })
    })

    it('passes through SFMC error message and code', async () => {
      nock(restUrl).get('/data/v1/customobjects').query(true).reply(400, { message: 'Bad thing', errorcode: 10001 })

      const response = await getDataExtensions(request, settings.subdomain, settings)

      expect(response).toEqual({ choices: [], error: { message: 'Bad thing', code: '10001' } })
    })

    it('keeps the 20002 permissions message', async () => {
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query(true)
        .reply(403, { message: 'Insufficient privileges', errorcode: 20002 })

      const response = await getDataExtensions(request, settings.subdomain, settings)

      expect(response.choices).toEqual([])
      expect(response.error?.code).toBe('20002')
      expect(response.error?.message).toContain('Insufficient privileges. Please input a data extension ID manually')
      expect(response.error?.message).toContain(
        'https://segment.com/docs/connections/destinations/catalog/actions-salesforce-marketing-cloud/'
      )
    })

    it('returns choices on success', async () => {
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query({ $search: '_' })
        .reply(200, { count: 1, items: [{ id: 'de-1', name: 'My DE', key: 'my-de' }] })

      const response = await getDataExtensions(request, settings.subdomain, settings)

      expect(response).toEqual({ choices: [{ value: 'de-1', label: 'My DE' }] })
    })
  })

  describe('selectOrCreateDataExtension', () => {
    it('returns an error when selecting fails without a response', async () => {
      nock(restUrl).get(`/data/v1/customobjects/${dataExtensionId}`).replyWithError('socket hang up')

      const response = await selectOrCreateDataExtension(
        request,
        settings.subdomain,
        {
          operation: 'select',
          dataExtensionId
        } as any,
        settings
      )

      expect(response.error?.code).toBe('ERROR')
      expect(response.error?.message).toContain('socket hang up')
    })

    it('returns an error when creating fails without a response', async () => {
      nock(restUrl).post('/data/v1/customobjects').replyWithError('socket hang up')

      const response = await selectOrCreateDataExtension(
        request,
        settings.subdomain,
        {
          operation: 'create',
          name: 'New DE',
          categoryId: '1',
          columns: [{ name: 'id', type: 'Text', isNullable: false, isPrimaryKey: true, length: 50 }]
        } as any,
        settings
      )

      expect(response.error?.code).toBe('ERROR')
      expect(response.error?.message).toContain('socket hang up')
    })
  })

  describe('getDataExtensionFields (keys/values dynamic fields)', () => {
    it('returns an error when the request fails without a response', async () => {
      nock(restUrl).get(`/data/v1/customobjects/${dataExtensionId}/fields`).replyWithError('socket hang up')

      const response = await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)

      expect(response.choices).toEqual([])
      expect(response.error?.code).toBe('BAD_REQUEST')
      expect(response.error?.message).toContain('socket hang up')
    })
  })
})
