import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Iterable Lists', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.iterable.com/api').get('/lists').reply(200, {})

      const settings = {
        apiKey: '123456'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('createAudience', () => {
    it('should create an audience', async () => {
      nock('https://api.iterable.com/api').get('/lists').times(1).reply(200, { lists: [] })
      nock('https://api.iterable.com/api').post('/lists').times(1).reply(200, {})

      const settings = {
        apiKey: '123456'
      }

      const createAudienceInput = {
        settings,
        audienceName: 'Test Audience',
        personas: {
          computation_key: 'test',
          computation_id: '12342352452562',
          namespace: 'spa_12312414212412'
        }
      }

      await expect(testDestination.createAudience(createAudienceInput)).resolves.not.toThrowError()
    })

    it('should return externalId of existing audience', async () => {
      nock('https://api.iterable.com/api')
        .get('/lists')
        .times(2)
        .reply(200, {
          lists: [
            {
              id: 123,
              name: 'test'
            }
          ]
        })

      nock('https://api.iterable.com/api').post('/lists').times(0).reply(200, {})

      const settings = {
        apiKey: '123456'
      }

      const createAudienceInput = {
        settings,
        audienceName: 'Test Audience',
        personas: {
          computation_key: 'test',
          computation_id: '12342352452562',
          namespace: 'spa_12312414212412'
        }
      }

      await expect(testDestination.createAudience(createAudienceInput)).resolves.toEqual({ externalId: '123' })
    })

    it('should throw error when `personas` object is not provided in audience settings', async () => {
      nock('https://api.iterable.com/api').post('/lists').reply(200, {})

      const settings = {
        apiKey: '123456'
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
      nock('https://api.iterable.com/api').post('/lists').times(0).reply(200, { lists: [] })

      const settings = {
        apiKey: '123456'
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
          apiKey: '123456'
        }
      }

      await expect(testDestination.getAudience(getAudienceInput)).resolves.not.toThrowError()
    })
  })
})
