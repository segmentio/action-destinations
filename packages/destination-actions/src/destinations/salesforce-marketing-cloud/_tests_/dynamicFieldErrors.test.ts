import nock from 'nock'
import { createRequestClient } from '@segment/actions-core'
import { getDataExtensions, getDataExtensionFields } from '../sfmc-operations'
import { Settings } from '../generated-types'

const request = createRequestClient()
const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}
const authUrl = `https://${settings.subdomain}.auth.marketingcloudapis.com`
const restUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com`

const mockToken = () =>
  nock(authUrl).post('/v2/token').reply(200, { access_token: 'test-access-token', token_type: 'Bearer' })

describe('Salesforce Marketing Cloud dynamic field errors', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getDataExtensions', () => {
    it('returns choices on success', async () => {
      mockToken()
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query(true)
        .reply(200, { items: [{ id: 'abc', name: 'My DE' }] })

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.choices).toEqual([{ value: 'abc', label: 'My DE' }])
      expect(response.error).toBeUndefined()
    })

    it.each([undefined, '', '   '])('asks for a keyword without calling SFMC when the query is %p', async (query) => {
      const token = mockToken()
      const search = nock(restUrl).get('/data/v1/customobjects').query(true).reply(200, { items: [] })

      const response = await getDataExtensions(request, settings.subdomain, settings, query)

      expect(response.choices).toEqual([])
      expect(response.error).toEqual({
        message: 'Type a keyword to search for Data Extensions.',
        code: 'NO_SEARCH_QUERY'
      })
      expect(token.isDone()).toBe(false)
      expect(search.isDone()).toBe(false)
    })

    it('sends the trimmed query as $search', async () => {
      mockToken()
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query({ $search: 'Loyalty' })
        .reply(200, { items: [{ id: 'abc', name: 'Loyalty_DE' }] })

      const response = await getDataExtensions(request, settings.subdomain, settings, '  Loyalty ')

      expect(response.choices).toEqual([{ value: 'abc', label: 'Loyalty_DE' }])
    })

    it('returns an error instead of throwing when the search has no HTTP response', async () => {
      mockToken()
      nock(restUrl).get('/data/v1/customobjects').query(true).replyWithError('socket hang up')

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.choices).toEqual([])
      expect(response.error?.message).toContain('socket hang up')
      expect(response.error?.code).toBe('BAD_REQUEST')
    })

    it('returns an error instead of throwing when the token request has no HTTP response', async () => {
      nock(authUrl).post('/v2/token').replyWithError('socket hang up')

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.choices).toEqual([])
      expect(response.error?.message).toContain('Failed to authenticate with Salesforce Marketing Cloud')
      expect(response.error?.message).toContain('socket hang up')
    })

    it('returns the SFMC error message and code when the token request is rejected', async () => {
      nock(authUrl).post('/v2/token').reply(401, { errorcode: 1, message: 'Invalid client' })

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.choices).toEqual([])
      expect(response.error).toEqual({
        message: 'Failed to authenticate with Salesforce Marketing Cloud: Invalid client',
        code: '1'
      })
    })

    it('keeps the permissions message for error code 20002', async () => {
      mockToken()
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query(true)
        .reply(403, { errorcode: 20002, message: 'Not Authorized' })

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.choices).toEqual([])
      expect(response.error?.code).toBe('20002')
      expect(response.error?.message).toContain('Not Authorized. Please input a data extension ID manually')
    })

    it('returns the SFMC error message for other HTTP errors', async () => {
      mockToken()
      nock(restUrl)
        .get('/data/v1/customobjects')
        .query(true)
        .reply(500, { errorcode: 10000, message: 'Internal error' })

      const response = await getDataExtensions(request, settings.subdomain, settings, 'test')

      expect(response.error).toEqual({ message: 'Internal error', code: '10000' })
    })
  })

  describe('getDataExtensionFields', () => {
    it('returns an error instead of throwing when the fields request has no HTTP response', async () => {
      mockToken()
      nock(restUrl).get('/data/v1/customobjects/123/fields').replyWithError('socket hang up')

      const response = await getDataExtensionFields(request, settings.subdomain, settings, '123', true)

      expect(response.choices).toEqual([])
      expect(response.error?.message).toContain('socket hang up')
      expect(response.error?.code).toBe('BAD_REQUEST')
    })

    it('returns an error instead of throwing when the token request has no HTTP response', async () => {
      nock(authUrl).post('/v2/token').replyWithError('socket hang up')

      const response = await getDataExtensionFields(request, settings.subdomain, settings, '123', true)

      expect(response.choices).toEqual([])
      expect(response.error?.message).toContain('Failed to authenticate with Salesforce Marketing Cloud')
    })
  })
})
