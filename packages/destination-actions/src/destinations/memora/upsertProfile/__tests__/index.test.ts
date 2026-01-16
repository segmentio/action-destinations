import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL, API_VERSION } from '../../index'

const testDestination = createTestIntegration(Destination)

const defaultSettings = {
  username: 'test-api-key',
  password: 'test-api-secret',
  twilioAccount: 'AC1234567890'
}

const defaultMapping = {
  memora_store: 'test-store-id',
  contact_identifiers: {
    email: { '@path': '$.properties.email' },
    phone: { '@path': '$.properties.phone' }
  },
  contact_traits: {
    firstName: { '@path': '$.properties.first_name' },
    lastName: { '@path': '$.properties.last_name' }
  }
}

describe('Memora.upsertProfile', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('perform (single profile)', () => {
    it('should import a profile with contact traits via CSV', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1-555-0100'
        }
      })

      let capturedImportBody: Record<string, unknown> = {}
      let capturedCSV = ''

      // Step 1: Mock the import initiation request
      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`, (body) => {
          capturedImportBody = body as Record<string, unknown>
          return true
        })
        .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
        .reply(201, {
          importId: 'mem_import_12345',
          url: 'https://example.com/presigned-url'
        })

      // Step 2: Mock the CSV upload to pre-signed URL
      nock('https://example.com')
        .put('/presigned-url', (body) => {
          capturedCSV = body as string
          return true
        })
        .reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect((responses[0].data as any).importId).toBe('mem_import_12345')

      // Validate the import request body
      expect(capturedImportBody.filename).toMatch(/memora-import-\d+\.csv/)
      expect(capturedImportBody.fileSize).toBeGreaterThan(0)
      expect(capturedImportBody.columnMappings).toHaveLength(4)

      // Validate CSV content
      const csvLines = capturedCSV.split('\n')
      expect(csvLines[0]).toContain('email')
      expect(csvLines[0]).toContain('phone')
      expect(csvLines[0]).toContain('firstName')
      expect(csvLines[0]).toContain('lastName')
      expect(csvLines[1]).toContain('john@example.com')
      expect(csvLines[1]).toContain('+1-555-0100')
      expect(csvLines[1]).toContain('John')
      expect(csvLines[1]).toContain('Doe')
    })

    it('should import profile with partial contact information', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        properties: {
          email: 'jane@example.com'
        }
      })

      let capturedCSV = ''

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com')
        .put('/presigned-url', (body) => {
          capturedCSV = body as string
          return true
        })
        .reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)

      // Validate CSV content
      const csvLines = capturedCSV.split('\n')
      expect(csvLines[0]).toBe('email')
      expect(csvLines[1]).toBe('jane@example.com')
    })

    it('should throw error when memora_store is missing', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            contact_identifiers: defaultMapping.contact_identifiers
          },
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should throw error when profile has no identifiers', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {}
      })

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact_identifiers: {}
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('Profile at index 0 must contain at least one identifier (email or phone)')
    })

    it('should succeed with only email provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com').put('/presigned-url').reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
    })

    it('should succeed with only phone provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          phone: '+1-555-0100'
        }
      })

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com').put('/presigned-url').reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            phone: { '@path': '$.properties.phone' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
    })

    it('should succeed with both email and phone provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          phone: '+1-555-0100'
        }
      })

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com').put('/presigned-url').reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
    })

    it('should not include X-Pre-Auth-Context header when twilioAccount is not provided', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .matchHeader('X-Pre-Auth-Context', (val) => val === undefined)
        .reply(201, {
          importId: 'mem_import_12345',
          url: 'https://example.com/presigned-url'
        })

      nock('https://example.com').put('/presigned-url').reply(200)

      const responses = await testDestination.testAction('upsertProfile', {
        event,
        settings: {
          username: 'test-api-key',
          password: 'test-api-secret'
        },
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
    })

    it('should throw error when import initiation returns non-201 status', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(400, { message: 'Invalid request' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Invalid request')
      }
    })

    it('should throw error when CSV upload fails', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com').put('/presigned-url').reply(500, { message: 'Upload failed' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected error to be thrown')
      } catch (error) {
        // The upload will fail with a retryable error
        expect(error).toBeInstanceOf(RetryableError)
      }
    })

    it('should properly escape CSV values with commas and quotes', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com',
          first_name: 'John, Jr.',
          last_name: 'O"Brien'
        }
      })

      let capturedCSV = ''

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com')
        .put('/presigned-url', (body) => {
          capturedCSV = body as string
          return true
        })
        .reply(200)

      await testDestination.testAction('upsertProfile', {
        event,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      // Validate CSV escaping
      expect(capturedCSV).toContain('"John, Jr."')
      expect(capturedCSV).toContain('"O""Brien"')
    })
  })

  describe('performBatch (multiple profiles)', () => {
    it('should import multiple profiles in a single CSV', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com',
            first_name: 'User',
            last_name: 'One'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
            email: 'user2@example.com',
            first_name: 'User',
            last_name: 'Two'
          }
        })
      ]

      let capturedCSV = ''

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com')
        .put('/presigned-url', (body) => {
          capturedCSV = body as string
          return true
        })
        .reply(200)

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: defaultMapping,
        useDefaultMappings: true
      })

      expect(responses[0].status).toBe(201)

      // Validate CSV has 2 rows (plus header)
      const csvLines = capturedCSV.split('\n')
      expect(csvLines).toHaveLength(3) // header + 2 rows
      expect(csvLines[1]).toContain('user1@example.com')
      expect(csvLines[2]).toContain('user2@example.com')
    })

    it('should throw error when batch is empty', async () => {
      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events: [],
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })

    it('should throw error when a profile in batch has no identifiers', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {}
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
            email: 'user2@example.com'
          }
        })
      ]

      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: {
            memora_store: 'test-store-id',
            contact_identifiers: {
              email: { '@path': '$.properties.email' }
            }
          },
          useDefaultMappings: false
        })
      ).rejects.toThrow('Profile at index 0 must contain at least one identifier (email or phone)')
    })

    it('should handle batch with sparse data correctly', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-2',
          properties: {
            phone: '+1-555-0200'
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user-3',
          properties: {
            email: 'user3@example.com',
            phone: '+1-555-0300',
            first_name: 'User'
          }
        })
      ]

      let capturedCSV = ''

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(201, {
        importId: 'mem_import_12345',
        url: 'https://example.com/presigned-url'
      })

      nock('https://example.com')
        .put('/presigned-url', (body) => {
          capturedCSV = body as string
          return true
        })
        .reply(200)

      const responses = await testDestination.testBatchAction('upsertProfile', {
        events,
        settings: defaultSettings,
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' }
          },
          contact_traits: {
            firstName: { '@path': '$.properties.first_name' }
          }
        },
        useDefaultMappings: false
      })

      expect(responses[0].status).toBe(201)

      // CSV should have all columns even if some rows don't have values
      const csvLines = capturedCSV.split('\n')
      expect(csvLines).toHaveLength(4) // header + 3 rows

      // Validate header has all fields
      expect(csvLines[0]).toContain('email')
      expect(csvLines[0]).toContain('phone')
      expect(csvLines[0]).toContain('firstName')
    })

    it('should throw error when import initiation fails for batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          userId: 'user-1',
          properties: {
            email: 'user1@example.com'
          }
        })
      ]

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(400, { message: 'Invalid column mapping' })

      try {
        await testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Invalid column mapping')
      }
    })
  })

  describe('error handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(400, { message: 'Invalid profile data' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Invalid profile data')
        expect((error as IntegrationError).code).toBe('INVALID_REQUEST_DATA')
        expect((error as IntegrationError).status).toBe(400)
      }
    })

    it('should handle 404 Not Found errors', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(404, { message: 'Store not found' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('Store not found')
        expect((error as IntegrationError).code).toBe('SERVICE_NOT_FOUND')
        expect((error as IntegrationError).status).toBe(404)
      }
    })

    it('should handle 429 Rate Limit errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(429, { message: 'Rate limit exceeded' }, { 'retry-after': '60' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Rate limit exceeded')
      }
    })

    it('should handle 429 Rate Limit with retry-after header', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(429, {}, { 'retry-after': '120' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        // Message should mention rate limit
        expect((error as RetryableError).message).toContain('Rate limit')
      }
    })

    it('should handle 500 Internal Server errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(500, { message: 'Internal server error' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Internal server error')
      }
    })

    it('should handle 503 Service Unavailable errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .reply(503, { message: 'Service unavailable' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toBe('Service unavailable')
      }
    })

    it('should handle other HTTP errors with default message', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL).post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`).reply(418, {})

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected IntegrationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError)
        expect((error as IntegrationError).message).toBe('HTTP 418 error')
        expect((error as IntegrationError).code).toBe('API_ERROR')
        expect((error as IntegrationError).status).toBe(418)
      }
    })

    it('should handle network errors as retryable', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-123',
        properties: {
          email: 'test@example.com'
        }
      })

      nock(BASE_URL)
        .post(`/${API_VERSION}/Stores/test-store-id/Profiles/Imports`)
        .replyWithError({ message: 'Network timeout', code: 'ETIMEDOUT' })

      try {
        await testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
        fail('Expected RetryableError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect((error as RetryableError).message).toContain('Network')
      }
    })
  })

  describe('dynamicFields', () => {
    describe('memora_store', () => {
      it('should fetch and return memory stores from Control Plane', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            stores: ['store-1', 'store-2', 'store-3'],
            meta: {
              pageSize: 100,
              nextToken: 'next-page-token'
            }
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([
          { label: 'store-1', value: 'store-1' },
          { label: 'store-2', value: 'store-2' },
          { label: 'store-3', value: 'store-3' }
        ])
      })

      it('should handle empty stores list', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, {
            stores: [],
            meta: { pageSize: 100 }
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch memora stores')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })

    describe('contact_traits (dynamic contact traits)', () => {
      it('should fetch and return contact traits from Control Plane', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups/Contact?includeTraits=true&pageSize=100`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, {
            traitGroup: {
              description: '',
              displayName: 'Contact',
              traits: {
                email: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'email',
                  idTypePromotion: 'email',
                  validationRule: null
                },
                phone: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'phone',
                  idTypePromotion: 'phone',
                  validationRule: null
                },
                firstName: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'firstName',
                  idTypePromotion: null,
                  validationRule: null
                },
                lastName: {
                  dataType: 'STRING',
                  description: '',
                  displayName: 'lastName',
                  idTypePromotion: null,
                  validationRule: null
                },
                age: {
                  dataType: 'NUMBER',
                  description: 'User age',
                  displayName: 'age',
                  idTypePromotion: null,
                  validationRule: null
                }
              }
            }
          })

        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        // Should exclude email and phone since they're identifiers (idTypePromotion = 'email' or 'phone')
        expect(result?.choices).toEqual([
          { label: 'firstName', value: 'firstName', description: 'firstName (STRING)' },
          { label: 'lastName', value: 'lastName', description: 'lastName (STRING)' },
          { label: 'age', value: 'age', description: 'User age' }
        ])
      })

      it('should return error when memora_store is not selected', async () => {
        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error?.message).toBe('Please select a Memora Store first')
        expect(result?.error?.code).toBe('STORE_REQUIRED')
      })

      it('should return error message when API call fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/test-store-id/TraitGroups/Contact?includeTraits=true&pageSize=100`)
          .reply(500, { message: 'Internal server error' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'contact_traits.__keys__', {
          settings: defaultSettings,
          payload: { memora_store: 'test-store-id' }
        })) as any

        expect(result?.choices).toEqual([])
        expect(result?.error).toBeDefined()
        expect(result?.error?.message).toContain('Unable to fetch contact traits')
        expect(result?.error?.code).toBe('FETCH_ERROR')
      })
    })
  })
})
