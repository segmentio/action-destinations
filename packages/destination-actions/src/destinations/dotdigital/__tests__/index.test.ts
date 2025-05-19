import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Dotdigital', () => {
  describe('testAuthentication', () => {
    it('should validate valid api key', async () => {
      nock('https://r1-api.dotdigital.com')
        .get('/v2/data-fields/')
        .matchHeader('Authorization', 'Basic YXBpX3VzZXJuYW1lOmFwaV9wYXNzd29yZA==')
        .reply(200)

      const settings = {
        api_host: 'https://r1-api.dotdigital.com',
        username: 'api_username',
        password: 'api_password'
      }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
      expect(nock.isDone()).toBe(true)
    })

    it('should not validate invalid api key', async () => {
      nock('https://r1-api.dotdigital.com')
        .get('/v2/data-fields/')
        .matchHeader('Authorization', 'Basic YXBpX3VzZXJuYW1lOmFwaV9wYXNzd29yZA==')
        .reply(401, {
          message: 'Authorization has been denied for this request.'
        })

      const settings = {
        api_host: 'https://r1-api.dotdigital.com',
        username: 'api_username',
        password: 'api_password'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
      expect(nock.isDone()).toBe(true)
    })
  })
})
