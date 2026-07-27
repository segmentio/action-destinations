import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const settings = {
  api_key: 'test_api_key',
  secret_key: 'test_secret_key',
  app_id: 'test_app_id',
  default_owner_email: 'owner@example.com',
  endpoint: 'north_america'
}

describe('Amplitude Cohorts', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: settings.default_owner_email })
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create an audience with user_id type using fetched seed user', async () => {
      const audienceId = 'test_cohort_123'

      // User Search API - first batch
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

      // Cohort creation - always uses BY_USER_ID and the seed user
      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', {
          name: 'Test Audience',
          app_id: settings.app_id,
          id_type: 'BY_USER_ID',
          ids: ['seed_user_1'],
          owner: 'owner@example.com',
          published: true
        })
        .reply(200, { cohortId: audienceId })

      // Seed user removal
      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: audienceId,
          skip_invalid_ids: true,
          memberships: [{
            ids: ['seed_user_1'],
            id_type: 'BY_NAME',
            operation: 'REMOVE'
          }]
        })
        .reply(200, {
          cohort_id: audienceId,
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Test Audience',
        audienceSettings: {
          id_type: 'BY_USER_ID',
          owner_email: 'owner@example.com'
        }
      })

      expect(result).toEqual({ externalId: audienceId })
    })

    it('should create an audience with amplitude_id type using fetched seed user', async () => {
      const audienceId = 'test_cohort_456'

      // User Search API
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '1' })
        .reply(200, {
          matches: [{ user_id: 'seed_user_amp', amplitude_id: 99999 }]
        })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '2' })
        .reply(200, { matches: [] })

      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: '3' })
        .reply(200, { matches: [] })

      // Cohort creation - always uses BY_USER_ID regardless of audience id_type
      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', {
          name: 'Test Amplitude ID Audience',
          app_id: settings.app_id,
          id_type: 'BY_USER_ID',
          ids: ['seed_user_amp'],
          owner: 'custom@example.com',
          published: true
        })
        .reply(200, { cohortId: audienceId })

      // Seed user removal
      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: audienceId,
          skip_invalid_ids: true,
          memberships: [{
            ids: ['seed_user_amp'],
            id_type: 'BY_NAME',
            operation: 'REMOVE'
          }]
        })
        .reply(200, {
          cohort_id: audienceId,
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Test Amplitude ID Audience',
        audienceSettings: {
          id_type: 'BY_AMP_ID',
          owner_email: 'custom@example.com'
        }
      })

      expect(result).toEqual({ externalId: audienceId })
    })

    it('should use user_id override and skip User Search', async () => {
      const audienceId = 'override_cohort'

      // No User Search mocks needed - it should not be called

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', {
          name: 'Override Audience',
          app_id: settings.app_id,
          id_type: 'BY_USER_ID',
          ids: ['my_known_user'],
          owner: 'owner@example.com',
          published: true
        })
        .reply(200, { cohortId: audienceId })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership', {
          cohort_id: audienceId,
          skip_invalid_ids: true,
          memberships: [{
            ids: ['my_known_user'],
            id_type: 'BY_NAME',
            operation: 'REMOVE'
          }]
        })
        .reply(200, {
          cohort_id: audienceId,
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Override Audience',
        audienceSettings: {
          id_type: 'BY_USER_ID',
          user_id: 'my_known_user'
        }
      })

      expect(result).toEqual({ externalId: audienceId })
    })

    it('should use audience_name override when provided', async () => {
      const audienceId = 'custom_name_cohort'

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
        .post('/api/3/cohorts/upload', {
          name: 'Custom Cohort Name',
          app_id: settings.app_id,
          id_type: 'BY_USER_ID',
          ids: ['seed_user'],
          owner: 'owner@example.com',
          published: true
        })
        .reply(200, { cohortId: audienceId })

      nock('https://amplitude.com')
        .post('/api/3/cohorts/membership')
        .reply(200, {
          cohort_id: audienceId,
          memberships_result: [{ skipped_ids: [], operation: 'REMOVE' }]
        })

      const result = await testDestination.createAudience({
        settings,
        audienceName: 'Original Audience Name',
        audienceSettings: {
          id_type: 'BY_USER_ID',
          audience_name: 'Custom Cohort Name'
        }
      })

      expect(result).toEqual({ externalId: audienceId })
    })
  })

  describe('getAudience', () => {
    it('should successfully retrieve an existing audience', async () => {
      const externalId = 'cohort_789'

      nock('https://amplitude.com').get(`/api/5/cohorts/request/${externalId}`).reply(200, {
        cohort_id: externalId,
        request_id: 'test_req_id'
      })

      const result = await testDestination.getAudience({
        settings,
        externalId
      })

      expect(result).toEqual({ externalId })
    })

    it('should throw error if cohort not found', async () => {
      const externalId = 'nonexistent_cohort'

      nock('https://amplitude.com').get(`/api/5/cohorts/request/${externalId}`).reply(200, {
        cohort_id: 'different_id',
        request_id: 'test_req_id'
      })

      await expect(
        testDestination.getAudience({
          settings,
          externalId
        })
      ).rejects.toThrowError('Cohort with id nonexistent_cohort not found')
    })
  })
})
