import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Voucherify from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Voucherify)

const settings: Settings = {
  apiKey: 'voucherifyApiKey',
  secretKey: 'voucherifySecretKey',
  customURL: 'https://us1.api.voucherify.io/segmentio'
}

describe('Voucherify', () => {
  describe('upsertCustomer', () => {
    it('should throw error when source_id is not specified', async () => {
      nock(settings.customURL).post('/customer-processing').reply(200)
      const testEvent = createTestEvent({
        traits: {
          name: 'Test'
        },
        type: 'identify'
      })

      await expect(
        testDestination.testAction('upsertCustomer', {
          event: testEvent,
          settings
        })
      ).rejects.toThrowError("The root value is missing the required field 'source_id'.")
    })
  })

  describe('assignCustomerToGroup', () => {
    it('should throw error when group_id is not specified', async () => {
      nock(settings.customURL).post('/group-processing').reply(200)
      const testEvent = createTestEvent({
        traits: {
          name: 'Test'
        },
        type: 'group',
        properties: {
          source_id: 'test_customer_1'
        }
      })

      await expect(
        testDestination.testAction('assignCustomerToGroup', {
          event: testEvent,
          settings
        })
      ).rejects.toThrowError("The root value is missing the required field 'group_id'.")
    })
  })
})
