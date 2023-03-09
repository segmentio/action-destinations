import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { API_BASE, UPSERT_ENDPOINT } from '../insider-helpers'
const testDestination = createTestIntegration(Definition)

describe('Insider Cloud Mode (Actions)', () => {
  describe('testAuthentication', () => {
    it('should validate authentication', async () => {
      nock(API_BASE).get(UPSERT_ENDPOINT).reply(200, { status: 'success' })
      const responses = await testDestination.testAction('testAuthentication', {
        settings: {
          account_name: 'test',
          ucd_key: 'test'
        }
      })

      expect(responses.length).toBe(0)
    })
  })
})
