import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../fbca-operations'
import nock from 'nock'

const testDestination = createTestIntegration(Destination)
const auth = {
  accessToken: '123',
  refreshToken: '321'
}

describe('FacebookCustomAudiences.sync', () => {
  describe('RETL', () => {
    const retlSettings = {
      retlAdAccountId: '123'
    }

    const hookOutputs = {
      audienceName: 'user-created-audience',
      audienceId: '900'
    }

    const event = createTestEvent({
      properties: {
        id: '1234',
        created_at: '2021-01-01T00:00:00.000Z',
        industry: 'Tech',
        phone: '555-555-5555',
        state: 'CA',
        city: 'San Francisco',
        annual_revenue: 1000000,
        account_id: '1234',
        zip_code: '92000',
        address: '123 Main St'
      }
    })

    it('should sync a single user', async () => {
      nock(`${BASE_URL}`).post(`/${retlSettings.retlAdAccountId}/users`).reply(200, { test: 'test' })

      const responses = await testDestination.testAction('sync', {
        event,
        settings: retlSettings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'add',
          phone: { '@path': '$.properties.phone' },
          address: {
            ct: { '@path': '$.properties.city' },
            st: { '@path': '$.properties.state' },
            zip: { '@path': '$.properties.zip_code' },
            country: 'US'
          },
          extern_id: { '@path': '$.properties.id' },
          retlOnMappingSave: {
            inputs: {},
            outputs: hookOutputs
          }
        }
      })

      console.log('responses', responses)
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      expect(responses[0].request.headers).toMatchInlineSnapshot()

      expect(responses[0].options.body).toMatchInlineSnapshot()
    })

    it.skip('should delete a single user', async () => {})
  })
})
