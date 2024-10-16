import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

describe('GoogleEnhancedConversions', () => {
  describe('uploadConversionAdjustment2 Single Event', () => {
    it('sends an event with default mappings - basic', async () => {
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
          currency: 'USD',
          value: '123',
          address: {
            street: '123 Street SW',
            city: 'San Diego',
            state: 'CA',
            postalCode: '982004'
          }
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends an event with default mappings - hashed data should not be hashed again', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674',
          orderId: '1234',
          phone: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
          firstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',
          lastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7',
          currency: 'USD',
          value: '123',
          address: {
            street: '123 Street SW',
            city: 'San Diego',
            state: 'CA',
            postalCode: '982004'
          }
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadConversionAdjustment2', {
          event,
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('fails if sync mode is not supported', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadConversionAdjustment2', {
          event,
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'upsert'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Unsupported Sync Mode "upsert"')
      }
    })

    it('sends restatement_value for restatements - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890',
          value: '123',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RESTATEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('does not send restatement_value for retractions - basic', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RETRACTION',
          conversion_timestamp: timestamp,
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'test@gmail.com',
          orderId: '1234'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadConversionAdjustment2', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('sends restatement_value for restatements - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890',
          value: '123',
          currency: 'USD'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RESTATEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('does not send restatement_value for retractions - with enhanced v12 flag', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'test@gmail.com',
          phone: '1234567890'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        features: { 'google-enhanced-v12': true },
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RETRACTION',
          conversion_timestamp: timestamp,
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('uses canary API version if flagon gate is set', async () => {
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
          currency: 'USD',
          value: '123',
          address: {
            street: '123 Street SW',
            city: 'San Diego',
            state: 'CA',
            postalCode: '982004'
          }
        }
      })

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('hashed email', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674',
          orderId: '1234',
          phone: '1234567890',
          firstName: 'Jane',
          lastName: 'Doe',
          currency: 'USD',
          value: '123',
          address: {
            street: '123 Street SW',
            city: 'San Diego',
            state: 'CA',
            postalCode: '982004'
          }
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction('uploadConversionAdjustment2', {
        event,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if email is invalid', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          gclid: '54321',
          email: 'anything',
          orderId: '1234'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testAction('uploadConversionAdjustment2', {
          event,
          features: { 'google-enhanced-v12': true },
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe("Email provided doesn't seem to be in a valid format.")
      }
    })
  })

  describe('uploadConversionAdjustment2 Batch Event', () => {
    it('sends an event with default mappings - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('sends an event with default mappings - hashed data should not be hashed again', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9', //'test1@gmail.com'
            phone: '64eab4e4d9e8e4f801e34d4f9043494ac3ccf778fb428dcbb555e632bb29d84b', // '6161729101'
            orderId: '1234',
            firstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',
            lastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47', //'test2@gmail.com'
            phone: '1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16', // '6161729102'
            orderId: '1234',
            firstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',
            lastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"64eab4e4d9e8e4f801e34d4f9043494ac3ccf778fb428dcbb555e632bb29d84b\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"1dba01a96da19f6df771cff07e0a8d822126709b82ae7adc6a3839b3aaa68a16\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testBatchAction('uploadConversionAdjustment2', {
          events,
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('fails if sync mode is not supported', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            orderId: '1234'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            orderId: '1234'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testBatchAction('uploadConversionAdjustment2', {
          events,
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'upsert'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Unsupported Sync Mode "upsert"')
      }
    })

    it('sends restatement_value for restatements - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test1@gmail.com',
            phone: '1234567890',
            value: '123',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test2@gmail.com',
            phone: '1234567890',
            value: '123',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RESTATEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('does not send restatement_value for retractions - basic', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test1@gmail.com',
            phone: '1234567890'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test2@gmail.com',
            phone: '1234567890'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RETRACTION',
          conversion_timestamp: timestamp,
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if customerId not set', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            gclid: '54321',
            email: 'test@gmail.com',
            orderId: '1234'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testBatchAction('uploadConversionAdjustment2', {
          events,
          features: { 'google-enhanced-v12': true },
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {}
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe('Customer ID is required for this action. Please set it in destination settings.')
      }
    })

    it('sends restatement_value for restatements - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            email: 'test1@gmail.com',
            phone: '1234567890',
            value: '123',
            currency: 'USD'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event',
          properties: {
            email: 'test2@gmail.com',
            phone: '1234567890',
            value: '123',
            currency: 'USD'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        features: { 'google-enhanced-v12': true },
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RESTATEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RESTATEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('does not send restatement_value for retractions - with enhanced v12 flag', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            email: 'test1@gmail.com',
            phone: '1234567890'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            email: 'test2@gmail.com',
            phone: '1234567890'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        features: { 'google-enhanced-v12': true },
        mapping: {
          gclid: '123a',
          conversion_action: '12345',
          adjustment_type: 'RETRACTION',
          conversion_timestamp: timestamp,
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"RETRACTION\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"123a\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('uses canary API version if flagon gate is set', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'test1@gmail.com',
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'test2@gmail.com',
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${CANARY_API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        },
        features: {
          [FLAGON_NAME]: true
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('hashed email', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9', //'test1@gmail.com'
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47', //'test2@gmail.com'
            orderId: '1234',
            phone: '1234567890',
            firstName: 'Jane',
            lastName: 'Doe',
            currency: 'USD',
            value: '123',
            address: {
              street: '123 Street SW',
              city: 'San Diego',
              state: 'CA',
              postalCode: '982004'
            }
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testBatchAction('uploadConversionAdjustment2', {
        events,
        mapping: {
          gclid: {
            '@path': '$.properties.gclid'
          },
          conversion_action: '12345',
          adjustment_type: 'ENHANCEMENT',
          conversion_timestamp: {
            '@path': '$.timestamp'
          },
          restatement_value: {
            '@path': '$.properties.value'
          },
          restatement_currency_code: {
            '@path': '$.properties.currency'
          },
          __segment_internal_sync_mode: 'add'
        },
        useDefaultMappings: true,
        settings: {
          customerId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversionAdjustments\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"a295fa4e457ca8c72751ffb6196f34b2349dcd91443b8c70ad76082d30dbdcd9\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}},{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"adjustmentType\\":\\"ENHANCEMENT\\",\\"adjustmentDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"orderId\\":\\"1234\\",\\"gclidDateTimePair\\":{\\"gclid\\":\\"54321\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\"},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"cc2e166955ec49675e749f9dce21db0cbd2979d4aac4a845bdde35ccb642bc47\\"},{\\"hashedPhoneNumber\\":\\"c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646\\"},{\\"addressInfo\\":{\\"hashedFirstName\\":\\"4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332\\",\\"hashedLastName\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\"}}],\\"userAgent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"restatementValue\\":{\\"adjustedValue\\":123,\\"currencyCode\\":\\"USD\\"}}],\\"partialFailure\\":true}"`
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    it('fails if email is invalid', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          event: 'Test Event 1',
          properties: {
            gclid: '54321',
            email: 'anything',
            orderId: '1234'
          }
        }),
        createTestEvent({
          timestamp,
          event: 'Test Event 2',
          properties: {
            gclid: '54321',
            email: 'anything',
            orderId: '1234'
          }
        })
      ]

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadConversionAdjustments`)
        .post('')
        .reply(201, { results: [{}] })

      try {
        await testDestination.testBatchAction('uploadConversionAdjustment2', {
          events,
          features: { 'google-enhanced-v12': true },
          mapping: {
            gclid: '123a',
            conversion_action: '12345',
            adjustment_type: 'ENHANCEMENT',
            __segment_internal_sync_mode: 'add'
          },
          useDefaultMappings: true,
          settings: {
            customerId
          }
        })
        fail('the test should have thrown an error')
      } catch (e: any) {
        expect(e.message).toBe("Email provided doesn't seem to be in a valid format.")
      }
    })
  })
})
