import nock from 'nock'
import { createRequestClient } from '@segment/actions-core'
import { getEndpointByRegion, fetchSeedUserId, removeSeedUser, createAudience, getAudience } from '../functions'

const requestClient = createRequestClient()

const settings = {
  api_key: 'test_api_key',
  secret_key: 'test_secret_key',
  app_id: 'test_app_id',
  default_owner_email: 'owner@example.com',
  endpoint: 'north_america'
}

describe('Amplitude Cohorts functions', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('getEndpointByRegion', () => {
    it('should return north america endpoint by default', () => {
      expect(getEndpointByRegion('cohorts_upload')).toBe('https://amplitude.com/api/3/cohorts/upload')
    })

    it('should return north america endpoint for undefined region', () => {
      expect(getEndpointByRegion('cohorts_upload', undefined)).toBe('https://amplitude.com/api/3/cohorts/upload')
    })

    it('should return europe endpoint when specified', () => {
      expect(getEndpointByRegion('cohorts_membership', 'europe')).toBe(
        'https://analytics.eu.amplitude.com/api/3/cohorts/membership'
      )
    })

    it('should return north america endpoint for unknown region', () => {
      expect(getEndpointByRegion('cohorts_membership', 'unknown_region')).toBe(
        'https://amplitude.com/api/3/cohorts/membership'
      )
    })

    it('should return usersearch endpoint for north america', () => {
      expect(getEndpointByRegion('usersearch', 'north_america')).toBe('https://amplitude.com/api/2/usersearch')
    })

    it('should return usersearch endpoint for europe', () => {
      expect(getEndpointByRegion('usersearch', 'europe')).toBe(
        'https://analytics.eu.amplitude.com/api/2/usersearch'
      )
    })

    it('should return cohorts_get_one endpoint for north america', () => {
      expect(getEndpointByRegion('cohorts_get_one', 'north_america')).toBe(
        'https://amplitude.com/api/5/cohorts/request'
      )
    })

    it('should return cohorts_get_one endpoint for europe', () => {
      expect(getEndpointByRegion('cohorts_get_one', 'europe')).toBe(
        'https://analytics.eu.amplitude.com/api/5/cohorts/request'
      )
    })
  })

  describe('fetchSeedUserId', () => {
    it('should return the first user_id found in the first batch', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'found_user_1', amplitude_id: 12345 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, {
          matches: []
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, {
          matches: []
        })

      const result = await fetchSeedUserId(request, 'north_america')
      expect(result).toBe('found_user_1')
    })

    it('should skip matches without user_id and find one in later results', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: null, amplitude_id: 111 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, {
          matches: [{ user_id: null, amplitude_id: 222 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, {
          matches: [{ user_id: 'real_user', amplitude_id: 333 }]
        })

      const result = await fetchSeedUserId(request, 'north_america')
      expect(result).toBe('real_user')
    })

    it('should search second batch if first batch yields no user_id', async () => {
      const request = requestClient

      // First batch returns no user_ids
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      // Second batch has a match
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '4' })
        .reply(200, {
          matches: [{ user_id: 'batch2_user', amplitude_id: 444 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '5' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '6' })
        .reply(200, { matches: [] })

      const result = await fetchSeedUserId(request, 'north_america')
      expect(result).toBe('batch2_user')
    })

    it('should throw IntegrationError when no users are found in any batch', async () => {
      const request = requestClient

      // All 9 searches return empty
      for (const prefix of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        nock('https://amplitude.com')
          .get('/api/2/usersearch')
          .query({ user: prefix })
          .reply(200, { matches: [] })
      }

      await expect(fetchSeedUserId(request, 'north_america')).rejects.toThrowError(
        'Unable to fetch a seed user from Amplitude. The project must contain at least one user with a User ID.'
      )
    })

    it('should use europe endpoint when configured', async () => {
      const request = requestClient

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'eu_user', amplitude_id: 100 }]
        })

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      const result = await fetchSeedUserId(request, 'europe')
      expect(result).toBe('eu_user')
    })
  })

  describe('removeSeedUser', () => {
    it('should send removal request and not throw on success', async () => {
      const request = requestClient

      const expectedBody = {
        cohort_id: 'cohort_abc',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['seed_user_1'],
          id_type: 'BY_NAME',
          operation: 'REMOVE'
        }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedBody)
        .reply(200, {
          cohort_id: 'cohort_abc',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      await expect(
        removeSeedUser(request, 'cohort_abc', 'north_america', 'seed_user_1')
      ).resolves.not.toThrow()
    })

    it('should not throw when removal request fails', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership')
        .reply(500, { error: 'Internal Server Error' })

      await expect(
        removeSeedUser(request, 'cohort_abc', 'north_america', 'seed_user_1')
      ).resolves.not.toThrow()
    })

    it('should use europe endpoint when configured', async () => {
      const request = requestClient

      const expectedBody = {
        cohort_id: 'cohort_eu',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['eu_seed_user'],
          id_type: 'BY_NAME',
          operation: 'REMOVE'
        }]
      }

      nock('https://analytics.eu.amplitude.com')
        .post('/api/3/cohorts/membership', expectedBody)
        .reply(200, {
          cohort_id: 'cohort_eu',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      await expect(
        removeSeedUser(request, 'cohort_eu', 'europe', 'eu_seed_user')
      ).resolves.not.toThrow()
    })
  })

  describe('createAudience', () => {
    it('should fetch a seed user, create the cohort, and remove the seed user', async () => {
      const request = requestClient

      // User Search - first batch
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'seed_user_1', amplitude_id: 12345 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      // Cohort creation
      const expectedUploadBody = {
        name: 'My Cohort',
        app_id: 'test_app_id',
        id_type: 'BY_USER_ID',
        ids: ['seed_user_1'],
        owner: 'custom@example.com',
        published: true
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', expectedUploadBody)
        .reply(200, { cohortId: 'new_cohort_id' })

      // Seed user removal
      const expectedRemovalBody = {
        cohort_id: 'new_cohort_id',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['seed_user_1'],
          id_type: 'BY_NAME',
          operation: 'REMOVE'
        }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRemovalBody)
        .reply(200, {
          cohort_id: 'new_cohort_id',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await createAudience(
        request,
        settings,
        'My Cohort',
        'BY_USER_ID',
        'custom@example.com'
      )

      expect(result).toBe('new_cohort_id')
    })

    it('should use provided user_id and skip User Search', async () => {
      const request = requestClient

      const expectedUploadBody = {
        name: 'Override Cohort',
        app_id: 'test_app_id',
        id_type: 'BY_USER_ID',
        ids: ['provided_user'],
        owner: 'owner@example.com',
        published: true
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', expectedUploadBody)
        .reply(200, { cohortId: 'override_cohort_id' })

      // Seed user removal
      const expectedRemovalBody = {
        cohort_id: 'override_cohort_id',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['provided_user'],
          id_type: 'BY_NAME',
          operation: 'REMOVE'
        }]
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', expectedRemovalBody)
        .reply(200, {
          cohort_id: 'override_cohort_id',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await createAudience(
        request,
        settings,
        'Override Cohort',
        'BY_USER_ID',
        undefined,
        'provided_user'
      )

      expect(result).toBe('override_cohort_id')
    })

    it('should use default_owner_email when owner_email is not provided', async () => {
      const request = requestClient

      const expectedUploadBody = {
        name: 'Default Owner Cohort',
        app_id: 'test_app_id',
        id_type: 'BY_USER_ID',
        ids: ['provided_user'],
        owner: 'owner@example.com',
        published: true
      }

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', expectedUploadBody)
        .reply(200, { cohortId: 'default_owner_cohort_id' })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership')
        .reply(200, {
          cohort_id: 'default_owner_cohort_id',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await createAudience(
        request,
        settings,
        'Default Owner Cohort',
        'BY_USER_ID',
        undefined,
        'provided_user'
      )

      expect(result).toBe('default_owner_cohort_id')
    })

    it('should throw IntegrationError when name is missing', async () => {
      const request = requestClient

      await expect(
        createAudience(request, settings, '', 'BY_USER_ID', 'owner@example.com')
      ).rejects.toThrowError('Missing audience name value')
    })

    it('should throw IntegrationError when id_type is missing', async () => {
      const request = requestClient

      await expect(
        createAudience(request, settings, 'My Cohort', '' as any, 'owner@example.com')
      ).rejects.toThrowError('Missing id_type value')
    })

    it('should throw IntegrationError when Amplitude returns no cohortId', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'seed_user', amplitude_id: 100 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload')
        .reply(200, {})

      await expect(
        createAudience(request, settings, 'My Cohort', 'BY_USER_ID', 'owner@example.com')
      ).rejects.toThrowError(
        'Invalid response from Amplitude Cohorts API when attempting to create new Cohort: Missing cohortId'
      )
    })

    it('should throw when cohort creation request fails', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'seed_user', amplitude_id: 100 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload')
        .reply(400, { error: 'Bad Request' })

      await expect(
        createAudience(request, settings, 'My Cohort', 'BY_USER_ID', 'owner@example.com')
      ).rejects.toThrowError('Bad Request')
    })

    it('should use europe endpoints when configured', async () => {
      const request = requestClient
      const euSettings = { ...settings, endpoint: 'europe' }

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'eu_seed', amplitude_id: 100 }]
        })

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://analytics.eu.amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      const expectedUploadBody = {
        name: 'EU Cohort',
        app_id: 'test_app_id',
        id_type: 'BY_USER_ID',
        ids: ['eu_seed'],
        owner: 'owner@example.com',
        published: true
      }

      nock('https://analytics.eu.amplitude.com')
        .post('/api/3/cohorts/upload', expectedUploadBody)
        .reply(200, { cohortId: 'eu_cohort_id' })

      const expectedRemovalBody = {
        cohort_id: 'eu_cohort_id',
        skip_invalid_ids: true,
        memberships: [{
          ids: ['eu_seed'],
          id_type: 'BY_NAME',
          operation: 'REMOVE'
        }]
      }

      nock('https://analytics.eu.amplitude.com')
        .post('/api/3/cohorts/membership', expectedRemovalBody)
        .reply(200, {
          cohort_id: 'eu_cohort_id',
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await createAudience(
        request,
        euSettings,
        'EU Cohort',
        'BY_USER_ID',
        undefined,
        undefined
      )

      expect(result).toBe('eu_cohort_id')
    })
  })

  describe('getAudience', () => {
    it('should resolve when cohort exists and matches externalId', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/5/cohorts/request/cohort_789')
        .reply(200, { cohort_id: 'cohort_789', request_id: 'req_123' })

      await expect(getAudience(request, settings, 'cohort_789')).resolves.not.toThrow()
    })

    it('should throw when API returns mismatched cohort_id', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/5/cohorts/request/expected_id')
        .reply(200, { cohort_id: 'different_id', request_id: 'req_456' })

      await expect(getAudience(request, settings, 'expected_id')).rejects.toThrowError(
        'Cohort with id expected_id not found'
      )
    })

    it('should throw when API returns no cohort_id', async () => {
      const request = requestClient

      nock('https://amplitude.com')
        .get('/api/5/cohorts/request/missing_id')
        .reply(200, {})

      await expect(getAudience(request, settings, 'missing_id')).rejects.toThrowError(
        'Invalid response from Amplitude Cohorts API when attempting to get Cohort: Missing cohort_id'
      )
    })

    it('should use europe endpoint when configured', async () => {
      const request = requestClient
      const euSettings = { ...settings, endpoint: 'europe' }

      nock('https://analytics.eu.amplitude.com')
        .get('/api/5/cohorts/request/eu_cohort')
        .reply(200, { cohort_id: 'eu_cohort', request_id: 'req_eu' })

      await expect(getAudience(request, euSettings, 'eu_cohort')).resolves.not.toThrow()
    })
  })
})
