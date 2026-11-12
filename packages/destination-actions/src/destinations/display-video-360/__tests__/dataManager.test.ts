import nock from 'nock'
import { createTestIntegration, IntegrationError, PayloadValidationError } from '@segment/actions-core'
import Destination from '../index'
import { DATA_MANAGER_BASE_URL, FLAGON_NAME_DATA_MANAGER, OAUTH_URL } from '../constants'

const testDestination = createTestIntegration(Destination)
const advertiserId = '424242'
const accountType = 'DISPLAY_VIDEO_ADVERTISER'
const listId = '8457147615'
const listName = `accountTypes/${accountType}/accounts/${advertiserId}/userLists/${listId}`
const listsPath = `/accountTypes/${accountType}/accounts/${advertiserId}/userLists`
const features = { [FLAGON_NAME_DATA_MANAGER]: true }
const audienceSettings = { advertiserId, accountType }

describe('Display Video 360 Data Manager API', () => {
  beforeEach(() => {
    nock.cleanAll()
    process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_ID = 'Clientz'
    process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_SECRET = 'Scretz'
    process.env.ACTIONS_DISPLAY_VIDEO_360_REFRESH_TOKEN = 'Freshy'
    nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
    nock(DATA_MANAGER_BASE_URL)
      .post(`${listsPath.replace('/userLists', '')}/partnerLinks`)
      .reply(200, {})
  })

  describe('createAudience', () => {
    it('creates a user list and returns its name as externalId', async () => {
      let body: any
      nock(DATA_MANAGER_BASE_URL)
        .post(listsPath, (b) => {
          body = b
          return true
        })
        .matchHeader('authorization', 'Bearer tok3n')
        .matchHeader('login-account', 'accountTypes/DATA_PARTNER/accounts/1663649500')
        .reply(200, { name: listName, id: listId })

      const res = await testDestination.createAudience({
        settings: {},
        audienceName: 'Mario Fans',
        audienceSettings,
        features
      })

      expect(res).toEqual({ externalId: listName })
      expect(body.displayName).toBe('Mario Fans')
      expect(body.membershipDuration).toBe('46656000s')
      expect(body.operations).toBeUndefined()
    })

    it('creates the partner link before the user list', async () => {
      nock.cleanAll()
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      let linkBody: any
      const link = nock(DATA_MANAGER_BASE_URL)
        .post(`/accountTypes/${accountType}/accounts/${advertiserId}/partnerLinks`, (b) => {
          linkBody = b
          return true
        })
        .reply(200, {})
      nock(DATA_MANAGER_BASE_URL).post(listsPath).reply(200, { name: listName, id: listId })

      await testDestination.createAudience({ settings: {}, audienceName: 'x', audienceSettings, features })

      expect(link.isDone()).toBe(true)
      expect(linkBody).toEqual({
        owningAccount: { accountId: advertiserId, accountType },
        partnerAccount: { accountId: '1663649500', accountType: 'DATA_PARTNER' }
      })
    })

    it('still creates the audience when the partner link fails', async () => {
      nock.cleanAll()
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(DATA_MANAGER_BASE_URL)
        .post(`/accountTypes/${accountType}/accounts/${advertiserId}/partnerLinks`)
        .reply(403, { error: { code: 403, status: 'PERMISSION_DENIED', message: 'no access' } })
      nock(DATA_MANAGER_BASE_URL).post(listsPath).reply(200, { name: listName, id: listId })

      await expect(
        testDestination.createAudience({ settings: {}, audienceName: 'x', audienceSettings, features })
      ).resolves.toEqual({ externalId: listName })
    })

    it('treats an existing partner link (409) as success', async () => {
      nock.cleanAll()
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(DATA_MANAGER_BASE_URL)
        .post(`/accountTypes/${accountType}/accounts/${advertiserId}/partnerLinks`)
        .reply(409, { error: { code: 409, status: 'ALREADY_EXISTS', message: 'exists' } })
      nock(DATA_MANAGER_BASE_URL).post(listsPath).reply(200, { name: listName, id: listId })

      await expect(
        testDestination.createAudience({ settings: {}, audienceName: 'x', audienceSettings, features })
      ).resolves.toEqual({ externalId: listName })
    })

    it('trims the advertiser ID', async () => {
      nock(DATA_MANAGER_BASE_URL).post(listsPath).reply(200, { name: listName, id: listId })
      await expect(
        testDestination.createAudience({
          settings: {},
          audienceName: 'Mario Fans',
          audienceSettings: { advertiserId: ` ${advertiserId} `, accountType },
          features
        })
      ).resolves.toEqual({ externalId: listName })
    })

    it('maps INVALID_ARGUMENT to a payload validation error', async () => {
      nock(DATA_MANAGER_BASE_URL)
        .post(listsPath)
        .reply(400, { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'displayName already exists' } })

      await expect(
        testDestination.createAudience({ settings: {}, audienceName: 'Dup', audienceSettings, features })
      ).rejects.toThrowError(PayloadValidationError)
    })

    it('retries transient errors', async () => {
      nock(DATA_MANAGER_BASE_URL)
        .post(listsPath)
        .reply(503, { error: { code: 503, status: 'UNAVAILABLE', message: 'try later' } })

      await expect(
        testDestination.createAudience({ settings: {}, audienceName: 'x', audienceSettings, features })
      ).rejects.toMatchObject({ status: 500 })
    })

    it('does not call Data Manager when the flag is off', async () => {
      const dm = nock(DATA_MANAGER_BASE_URL).post(listsPath).reply(200, { name: listName, id: listId })
      nock('https://audiencepartner.googleapis.com')
        .post(/.*/)
        .reply(200, { results: [{ resourceName: 'legacy/1' }] })

      const res = await testDestination.createAudience({
        settings: {},
        audienceName: 'x',
        audienceSettings
      })

      expect(res).toEqual({ externalId: 'legacy/1' })
      expect(dm.isDone()).toBe(false)
    })
  })

  describe('getAudience', () => {
    it('does not call Data Manager when the flag is off', async () => {
      const legacyId = `products/${accountType}/customers/${advertiserId}/userLists/${listId}`
      const dm = nock(DATA_MANAGER_BASE_URL).get(`${listsPath}/${listId}`).reply(200, { name: listName, id: listId })
      const legacy = nock('https://audiencepartner.googleapis.com')
        .post(/.*/)
        .reply(200, [{ results: [{ userList: { resourceName: legacyId, membershipStatus: 'OPEN' } }] }])

      const res = await testDestination.getAudience({
        settings: {},
        audienceSettings,
        externalId: legacyId
      })

      expect(res).toEqual({ externalId: legacyId })
      expect(legacy.isDone()).toBe(true)
      expect(dm.isDone()).toBe(false)
    })

    it('returns the externalId when the list exists', async () => {
      nock(DATA_MANAGER_BASE_URL).get(`${listsPath}/${listId}`).reply(200, { name: listName, id: listId })

      const res = await testDestination.getAudience({
        settings: {},
        audienceSettings,
        externalId: listName,
        features
      })
      expect(res).toEqual({ externalId: listName })
    })

    it('accepts legacy Audience Partner resource names', async () => {
      nock(DATA_MANAGER_BASE_URL).get(`${listsPath}/${listId}`).reply(200, { name: listName, id: listId })

      const legacy = `products/${accountType}/customers/${advertiserId}/userLists/${listId}`
      const res = await testDestination.getAudience({
        settings: {},
        audienceSettings,
        externalId: legacy,
        features
      })
      expect(res).toEqual({ externalId: legacy })
    })

    it('maps 404 to INVALID_REQUEST_DATA', async () => {
      nock(DATA_MANAGER_BASE_URL)
        .get(`${listsPath}/${listId}`)
        .reply(404, { error: { code: 404, status: 'NOT_FOUND', message: 'not found' } })

      const p = testDestination.getAudience({ settings: {}, audienceSettings, externalId: listName, features })
      await expect(p).rejects.toThrowError(IntegrationError)
      await expect(p).rejects.toMatchObject({ code: 'INVALID_REQUEST_DATA', status: 400 })
    })

    it('fails when the returned id does not match', async () => {
      nock(DATA_MANAGER_BASE_URL).get(`${listsPath}/${listId}`).reply(200, { name: 'other', id: '999' })

      await expect(
        testDestination.getAudience({ settings: {}, audienceSettings, externalId: listName, features })
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST_DATA' })
    })
  })
})
