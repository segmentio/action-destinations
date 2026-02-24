import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_VERSION } from '../../versioning-info'
import { BASE_URL } from '../../constants'

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
      expect(capturedImportBody.filename).toMatch(/^memora-segment-import-test-store-id-\d{13}\.csv$/)
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

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
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

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
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

    it('should escape CSV header field names with special characters', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user-456',
        properties: {
          email: 'test@example.com'
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
        mapping: {
          memora_store: 'test-store-id',
          contact_identifiers: {
            email: { '@path': '$.properties.email' }
          },
          contact_traits: {
            'first,name': { '@path': '$.properties.email' },
            'last"name': { '@path': '$.properties.email' }
          }
        },
        useDefaultMappings: true
      })

      // Validate CSV header escaping - field names with special characters should be escaped
      const csvLines = capturedCSV.split('\n')
      const header = csvLines[0]
      expect(header).toContain('"first,name"')
      expect(header).toContain('"last""name"')
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

      await expect(
        testDestination.testBatchAction('upsertProfile', {
          events,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should throw error when API returns error response', async () => {
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

      await expect(
        testDestination.testAction('upsertProfile', {
          event,
          settings: defaultSettings,
          mapping: defaultMapping,
          useDefaultMappings: true
        })
      ).rejects.toThrow()
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

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-1', displayName: 'Store One' })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-2`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-2', displayName: 'Store Two' })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-3`)
          .matchHeader('X-Pre-Auth-Context', 'AC1234567890')
          .reply(200, { id: 'store-3', displayName: 'Store Three' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([
          { label: 'Store One', value: 'store-1' },
          { label: 'Store Two', value: 'store-2' },
          { label: 'Store Three', value: 'store-3' }
        ])
      })

      it('should fall back to store id when displayName is empty', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, { stores: ['store-no-name'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-no-name`)
          .reply(200, { id: 'store-no-name', displayName: '' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: defaultSettings,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([{ label: 'store-no-name', value: 'store-no-name' }])
      })

      it('should not include X-Pre-Auth-Context header in store detail requests when twilioAccount is not set', async () => {
        const settingsNoTwilio = { username: 'test-api-key', password: 'test-api-secret' }

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .matchHeader('X-Pre-Auth-Context', (val) => val === undefined)
          .reply(200, { stores: ['store-1'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
          .matchHeader('X-Pre-Auth-Context', (val) => val === undefined)
          .reply(200, { id: 'store-1', displayName: 'Store One' })

        const result = (await testDestination.testDynamicField('upsertProfile', 'memora_store', {
          settings: settingsNoTwilio,
          payload: {}
        })) as any

        expect(result?.choices).toEqual([{ label: 'Store One', value: 'store-1' }])
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

      it('should return error when a store detail request fails', async () => {
        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`)
          .reply(200, { stores: ['store-1'] })

        nock(BASE_URL)
          .get(`/${API_VERSION}/ControlPlane/Stores/store-1`)
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
        expect(result?.error?.message).toContain('Enter the memora store ID manually.')
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
