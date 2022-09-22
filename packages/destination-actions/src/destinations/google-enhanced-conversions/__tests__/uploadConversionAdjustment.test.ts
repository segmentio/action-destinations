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

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"UNSPECIFIED\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10T18:08:04.000Z\\"},\\"restatementValue\\":{},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}],\\"partialFailure\\":true}"`
      )

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
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
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
        expect(e.message).toBe('Order ID required for enhancements')
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
        expect(e.message).toBe('GCLID required for chosen conversion type')
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
        expect(e.message).toBe('Restatement value required for restatements')
      }
    })
  })
})
