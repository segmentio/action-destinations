import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const settings = {
  api_key: 'test_api_key',
  secret_key: 'test_secret_key',
  app_id: 'test_app_id',
  owner_email: 'owner@example.com',
  endpoint: 'north_america'
}

describe('Amplitude Cohorts', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://amplitude.com')
        .get('/api/2/usersearch')
        .query({ user: 'testUser@example.com' })
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create an audience with user_id type', async () => {
      const audienceId = 'test_cohort_123'

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', {
          name: 'Test Audience',
          app_id: settings.app_id,
          id_type: 'BY_USER_ID',
          ids: [],
          owner: 'owner@example.com',
          published: true
        })
        .reply(200, {
          cohortId: audienceId
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

    it('should create an audience with amplitude_id type', async () => {
      const audienceId = 'test_cohort_456'

      nock('https://amplitude.com')
        .post('/api/3/cohorts/upload', {
          name: 'Test Amplitude ID Audience',
          app_id: settings.app_id,
          id_type: 'BY_AMP_ID',
          ids: [],
          owner: 'custom@example.com',
          published: true
        })
        .reply(200, {
          cohortId: audienceId
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
  })

  describe('getAudience', () => {
    it('should successfully retrieve an existing audience', async () => {
      const externalId = 'cohort_789'

      nock('https://amplitude.com')
        .get(`/api/5/cohorts/request/${externalId}`)
        .reply(200, {
          cohortId: externalId
        })

      const result = await testDestination.getAudience({
        settings,
        externalId
      })

      expect(result).toEqual({ externalId })
    })

    it('should throw error if cohort not found', async () => {
      const externalId = 'nonexistent_cohort'

      nock('https://amplitude.com')
        .get(`/api/5/cohorts/request/${externalId}`)
        .reply(200, {
          cohortId: 'different_id'
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
