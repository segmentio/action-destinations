import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Iterable Lists', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.iterable.com/api').get('/lists').reply(200, {})

      const settings = {
        apiKey: '12345'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create an audience', async () => {
      nock('https://api.iterable.com/api').post('/lists').reply(200, {})

      const settings = {
        apiKey: '12345'
      }

      const audienceSettings = {
        personas: {
          computation_key: 'test'
        }
      }

      const createAudienceInput = {
        settings,
        audienceSettings,
        audienceName: 'Test Audience'
      }

      await expect(testDestination.createAudience(createAudienceInput)).resolves.not.toThrowError()
    })

    it('should throw error when `personas` object is not provided in audience settings', async () => {
      nock('https://api.iterable.com/api').post('/lists').reply(200, {})

      const settings = {
        apiKey: '12345'
      }

      const audienceSettings = {}

      const createAudienceInput = {
        settings,
        audienceSettings,
        audienceName: 'Test Audience'
      }

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError()
    })

    it('should throw error when `computation_key` is not provided under `personas` object, under audience settings', async () => {
      nock('https://api.iterable.com/api').post('/lists').reply(200, {})

      const settings = {
        apiKey: '12345'
      }

      const audienceSettings = {
        personas: {}
      }

      const createAudienceInput = {
        settings,
        audienceSettings,
        audienceName: 'Test Audience'
      }

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError()
    })
  })

  describe('getAudience', () => {
    it('should get an audience', async () => {
      const getAudienceInput = {
        externalId: '12345',
        settings: {
          apiKey: '12345'
        }
      }

      await expect(testDestination.getAudience(getAudienceInput)).resolves.not.toThrowError()
    })
  })
})
