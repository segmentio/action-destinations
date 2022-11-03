import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Close', () => {
  describe('testAuthentication', () => {
    it('should validate valid api key', async () => {
      nock('https://api.close.com/')
        .get('/api/v1/me/?_fields=id')
        .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
        .reply(200, {})

      const settings = {
        api_key: 'api_keyid.keysecret',
        contact_custom_field_id_for_user_id: 'cf_id1'
      }
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
      expect(nock.isDone()).toBe(true)
    })

    it('should not validate invalid api key', async () => {
      nock('https://api.close.com/')
        .get('/api/v1/me/?_fields=id')
        .matchHeader('Authorization', 'Basic YXBpX2tleWlkLmtleXNlY3JldDo=')
        .reply(401, {
          error:
            "The server could not verify that you are authorized to access the URL requested. You either supplied the wrong credentials (e.g. a bad password), or your browser doesn't understand how to supply the credentials required."
        })

      const settings = {
        api_key: 'api_keyid.keysecret',
        contact_custom_field_id_for_user_id: 'cf_id1'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
      expect(nock.isDone()).toBe(true)
    })
  })
})
