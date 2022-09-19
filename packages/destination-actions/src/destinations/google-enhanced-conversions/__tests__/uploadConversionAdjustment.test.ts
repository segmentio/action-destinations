import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadConversionAdjustment', () => {
    it('should send an event with default mappings', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234',
          phone: '1234567890',
          firstName: 'Jane',
          lastName: 'Doe',
          address: {
            street: '123 Street SW',
            city: 'San Diego',
            state: 'CA',
            postalCode: '982004'
          }
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      const responses = await testDestination.testAction('uploadConversionAdjustment', {
        event,
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'UNSPECIFIED',
          conversion_timestamp: timestamp
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot()

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('should fail if customerId not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234'
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadConversionAdjustment', {
          event,
          mapping: { gclid: '123a', conversion_action: '12345', adjustment_type: 'UNSPECIFIED' },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Customer id is required for this action. Please set it in destination settings.')
      }
    })

    it('should fail if conversion_type is enhancement and orderid not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadConversionAdjustment', {
          event,
          mapping: { gclid: '123a', conversion_action: '12345', adjustment_type: 'ENHANCEMENT' },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Order id required for enhancement conversion')
      }
    })

    it('should fail if conversion_type is not enhancement and gclid not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadConversionAdjustment', {
          event,
          mapping: { conversion_action: '12345', adjustment_type: 'UNKNOWN' },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Gclid required for chosen conversion type')
      }
    })

    it('should fail if conversion_type is not enhancement and conversion_timestamp not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadConversionAdjustment', {
          event,
          mapping: { gclid: '123a', conversion_action: '12345', adjustment_type: 'UNKNOWN' },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Conversion timestamp required for chosen conversion type')
      }
    })

    it('should fail if conversion_type is not restatement and restatement_value not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/v11/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, {})

      try {
        await testDestination.testAction('uploadConversionAdjustment', {
          event,
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'RESTATEMENT',
            conversion_timestamp: timestamp
          },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Restatement value required for restatement conversion')
      }
    })
  })
})
