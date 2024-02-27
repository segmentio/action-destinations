import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import { API_HOST, API_PATH } from '../emarsys-helper'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Emarsys', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(`${API_HOST}`)
        .get(`${API_PATH}settings`)
        .reply(200, {
          replyCode: 0,
          replyText: 'OK',
          data: {
            id: 123456,
            environment: 'suitex.emarys.net',
            timezone: 'Europe/Vienna',
            name: 'segment_test_account',
            password_history_queue_size: 3,
            country: '',
            totalContacts: '1319053'
          }
        })

      // This should match your authentication.fields
      const authData = {
        api_user: 'test001',
        api_password: 'test_secret'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
