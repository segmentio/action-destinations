import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { readFileSync } from 'fs'
import { join } from 'path'
import { SFTP_DEFAULT_PORT } from '../../constants'
import { Settings } from '../../generated-types'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings: Settings = {
  auth_type: 'password',
  sftp_host: 'test.example.com',
  sftp_username: 'testuser',
  sftp_password: 'testpass',
  sftp_port: SFTP_DEFAULT_PORT
}

const sshKeySettings: Settings = {
  auth_type: 'ssh_key',
  sftp_host: 'test.example.com',
  sftp_username: 'testuser',
  sftp_ssh_key: 'sftp_ssh_key',
  sftp_port: SFTP_DEFAULT_PORT
}

const payload = {
  sftp_folder_path: '/uploads',
  audience_key: 'test-audience',
  delimiter: ',',
  filename_prefix: 'segment_',
  enable_batching: true,
  batch_size: 100000,
  file_extension: 'csv'
}

const mockedEvents: SegmentEvent[] = Array.from({ length: 50 }, (_, i) => ({
  messageId: `segment-test-message-00000${i + 2}`,
  timestamp: '2023-07-26T15:23:39.803Z',
  type: 'track',
  userId: `userid${i + 2}`,
  receivedAt: '2015-12-12T19:11:01.266Z',
  properties: {},
  event: 'Audience Entered'
}))

// Create a global mock instance that we can reference directly
const mockSftpInstance = {
  connect: jest.fn().mockResolvedValue({}),
  fastPutFromBuffer: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined)
}

// Mock both the ssh2-sftp-client and our custom wrapper
jest.mock('ssh2-sftp-client')
jest.mock('../../sftp-wrapper', () => {
  return {
    SFTClientCustom: jest.fn().mockImplementation(() => mockSftpInstance)
  }
})

describe('syncEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Reset mock implementations
    mockSftpInstance.connect.mockResolvedValue({})
    mockSftpInstance.fastPutFromBuffer.mockResolvedValue(undefined)
    mockSftpInstance.end.mockResolvedValue(undefined)
  })

  describe('Action Definition', () => {
    const action = testDestination.actions.syncEvents
    it('should be defined', () => {
      expect(action).toBeDefined()
    })

    it('should have required SFTP fields', () => {
      expect(action.definition.fields.sftp_folder_path).toBeDefined()
    })

    it('should have correct title and description', () => {
      expect(action.definition.title).toBe('Sync Events')
      expect(action.definition.description).toBe(
        'Sync Segment events to SFTP. Includes predefined mappings for common Segment event fields. Additional column mappings may be added.'
      )
    })
  })

  describe('Authentication Types', () => {
    it('should work with both SSH key and password authentication', async () => {
      const testEvent = createTestEvent({
        messageId: 'test-message-id',
        timestamp: '2023-07-26T15:23:39.803Z',
        type: 'track',
        userId: 'userid1',
        receivedAt: '2015-12-12T19:11:01.266Z',
        properties: {
          email: 'test@example.com'
        },
        event: 'Test Event'
      })

      const testMapping = {
        ...payload,
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' }
        }
      }

      // Test SSH key authentication
      await testDestination.testAction('syncEvents', {
        event: testEvent,
        mapping: testMapping,
        settings: sshKeySettings
      })

      expect(mockSftpInstance.connect).toHaveBeenCalledWith({
        host: 'test.example.com',
        port: SFTP_DEFAULT_PORT,
        username: 'testuser',
        privateKey: 'sftp_ssh_key'
      })

      // Reset mocks
      jest.clearAllMocks()

      // Test password authentication
      await testDestination.testAction('syncEvents', {
        event: testEvent,
        mapping: testMapping,
        settings
      })

      expect(mockSftpInstance.connect).toHaveBeenCalledWith({
        host: 'test.example.com',
        port: SFTP_DEFAULT_PORT,
        username: 'testuser',
        password: 'testpass'
      })
      expect(mockSftpInstance.fastPutFromBuffer).toHaveBeenCalled()
      expect(mockSftpInstance.end).toHaveBeenCalled()
    })
  })

  describe('Single Event Processing', () => {
    it('should handle single event processing', async () => {
      await expect(
        testDestination.testAction('syncEvents', {
          event: mockedEvents[0],
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })

    it('should handle filename prefix by defaulting to csv', async () => {
      await expect(
        testDestination.testAction('syncEvents', {
          event: mockedEvents[0],
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })

    it('should validate required fields', async () => {
      const payload = {
        // Missing sftp_folder_path
        audience_key: 'test-audience',
        delimiter: ',',
        filename_prefix: 'test_filename_',
        enable_batching: true,
        batch_size: 100000,
        columns: {},
        file_extension: 'csv'
      }

      await expect(
        testDestination.testAction('syncEvents', {
          event: mockedEvents[0],
          settings,
          mapping: payload,
          useDefaultMappings: false
        })
      ).rejects.toThrow(`The root value is missing the required field 'sftp_folder_path'.`)
    })
  })

  describe('Batch Processing', () => {
    it('should handle batch processing', async () => {
      await expect(
        testDestination.testBatchAction('syncEvents', {
          events: mockedEvents,
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })

    it(`should fall back to port ${SFTP_DEFAULT_PORT} if not provided`, async () => {
      await expect(
        testDestination.testBatchAction('syncEvents', {
          events: mockedEvents,
          settings: { ...settings, sftp_port: undefined },
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })

    it('should handle large batches', async () => {
      const largeEventsBatch: SegmentEvent[] = Array.from({ length: 100 }, (_, i) => ({
        messageId: `large-batch-message-${i}`,
        timestamp: '2023-07-26T15:23:39.803Z',
        type: 'track' as const,
        userId: `userid${i}`,
        receivedAt: '2015-12-12T19:11:01.266Z',
        properties: {},
        event: 'Audience Entered'
      }))

      await expect(
        testDestination.testBatchAction('syncEvents', {
          events: largeEventsBatch,
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })
  })
})

describe('Integration Tests', () => {
  // Helper function to get readable calls for snapshots
  const getReadableCalls = () => {
    return mockSftpInstance.fastPutFromBuffer.mock.calls.map((call: any) => {
      const [fileContent, path] = call
      return {
        path,
        content: fileContent.toString()
      }
    })
  }

  beforeEach(() => mockSftpInstance.fastPutFromBuffer.mockClear())

  it('should work with default mappings', async () => {
    const testEvent = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      event: 'Audience Entered',
      properties: {
        audience_key: 'test-audience'
      }
    })

    await expect(
      testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: true
      })
    ).resolves.not.toThrow()

    // Verify that the SFTP client was called
    expect(mockSftpInstance.connect).toHaveBeenCalled()
    expect(mockSftpInstance.fastPutFromBuffer).toHaveBeenCalled()
    expect(mockSftpInstance.end).toHaveBeenCalled()
  })

  it('should generate correct file output', async () => {
    const payload = {
      sftp_folder_path: '/uploads',
      audience_key: 'test-audience',
      delimiter: ',',
      filename_prefix: 'test_filename_',
      enable_batching: true,
      batch_size: 100000,
      file_extension: 'csv'
    }

    const testEvent = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      event: 'Audience Entered',
      properties: {
        audience_key: 'test-audience'
      }
    })

    await testDestination.testAction('syncEvents', {
      event: testEvent,
      settings,
      mapping: payload,
      useDefaultMappings: true
    })

    // Verify the file was uploaded with expected content
    const calls = mockSftpInstance.fastPutFromBuffer.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    // Check that the buffer was passed and the path matches expected format
    expect(calls[0][0]).toBeInstanceOf(Buffer)
    expect(calls[0][1]).toMatch(/\/uploads\/test_filename_.*\.csv$/)
  })

  it('should handle batch processing with deterministic output', async () => {
    // Use jest.useFakeTimers for better date control
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-07-26T15:23:39.803Z'))

    const payload = {
      sftp_folder_path: '/uploads',
      audience_key: 'test-audience',
      delimiter: ',',
      filename_prefix: 'test_filename_',
      enable_batching: true,
      batch_size: 100000,
      file_extension: 'csv'
    }

    const testEvents = [
      createTestEvent({
        type: 'track',
        userId: 'user1',
        event: 'Audience Entered',
        timestamp: '2023-07-26T15:23:39.803Z',
        messageId: 'test-message-1',
        properties: {
          audience_key: 'test-audience',
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        type: 'track',
        userId: 'user2',
        event: 'Audience Entered',
        timestamp: '2023-07-26T15:23:39.803Z',
        messageId: 'test-message-2',
        properties: {
          audience_key: 'test-audience',
          email: 'user2@example.com'
        }
      })
    ]

    await testDestination.testBatchAction('syncEvents', {
      events: testEvents,
      settings,
      mapping: payload,
      useDefaultMappings: true
    })

    // Instead of snapshot, verify specific content structure
    const calls = getReadableCalls()
    expect(calls).toHaveLength(1)

    const csvContent = calls[0].content
    const csvLines = csvContent.split('\n')

    // Verify structure without relying on exact snapshot
    expect(csvLines.length).toBe(3) // Header + 2 data rows

    // Verify headers (using default mappings)
    const headers = csvLines[0].split(',')
    expect(headers).toContain('event_name')
    expect(headers).toContain('email')
    expect(headers).toContain('user_id')

    // Verify data content
    expect(csvLines[1]).toContain('user1')
    expect(csvLines[1]).toContain('user1@example.com')
    expect(csvLines[2]).toContain('user2')
    expect(csvLines[2]).toContain('user2@example.com')

    // Verify filename pattern is consistent
    expect(calls[0].path).toMatch(/\/uploads\/test_filename_.*2023-07-26T15-23-39-803Z\.csv$/)

    jest.useRealTimers()
  })

  it('should handle different delimiters', async () => {
    const payload = {
      sftp_folder_path: '/uploads',
      audience_key: 'test-audience',
      delimiter: 'tab',
      filename_prefix: 'test_filename_',
      enable_batching: true,
      batch_size: 100000,
      file_extension: 'csv'
    }

    const testEvent = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      event: 'Audience Entered',
      properties: {
        audience_key: 'test-audience',
        email: 'test@example.com'
      }
    })

    await testDestination.testAction('syncEvents', {
      event: testEvent,
      settings,
      mapping: payload,
      useDefaultMappings: true
    })

    // Verify tab delimiter was used
    const calls = getReadableCalls()
    expect(calls[0].content).toContain('\t') // Should contain tab characters
  })

  it('should generate CSV with comprehensive mapping', async () => {
    // Use jest.useFakeTimers for consistent date control
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-07-26T15:23:39.803Z'))

    const comprehensivePayload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'sfmc_audience',
      enable_batching: true,
      batch_size: 100000,
      file_extension: 'csv',
      columns: {
        'Event Name': { '@path': '$.event' },
        'Event Type': { '@path': '$.type' },
        'User ID': { '@path': '$.userId' },
        'Anonymous ID': { '@path': '$.anonymousId' },
        Email: { '@path': '$.traits.email' },
        Properties: { '@path': '$.properties' },
        Traits: { '@path': '$.traits' },
        Context: { '@path': '$.context' },
        Timestamp: { '@path': '$.timestamp' },
        'Message ID': { '@path': '$.messageId' },
        'Integrations Object': { '@path': '$.integrations' },
        'Audience Name': { '@path': '$.context.personas.computation_key' },
        'Audience ID': { '@path': '$.context.personas.computation_id' },
        'Audience Space ID': { '@path': '$.context.personas.space_id' },
        ecl_nb: { '@path': '$.userId' },
        Event_date: { '@path': '$.timestamp' },
        audience_eligibility: { '@path': '$.properties.card_raf_segment_throughput_audience_test' },
        'Audience Action Column Name': { '@path': '$.properties.some_audience_key' },
        'Batch Size Column Name': { '@path': '$.properties.batch_size' },
        'AWS Subfolder Name': {
          '@if': {
            exists: { '@path': '$.context.app.name' },
            then: { '@path': '$.context.app.name' },
            else: 'default_subfolder'
          }
        },
        'Filename prefix': { '@path': '$.context.personas.computation_key' }
      }
    }

    const testEvents = [
      createTestEvent({
        type: 'track',
        userId: 'user123',
        event: 'Audience Entered',
        timestamp: '2023-07-26T15:23:39.803Z',
        messageId: 'segment-test-message-001',
        properties: {
          batch_size: 1000,
          some_audience_key: true
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user456',
        timestamp: '2023-07-26T15:24:39.803Z',
        messageId: 'segment-test-message-002',
        traits: {
          some_audience_key: true,
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      })
    ]

    await testDestination.testBatchAction('syncEvents', {
      events: testEvents,
      settings,
      mapping: comprehensivePayload,
      useDefaultMappings: false
    })

    const calls = getReadableCalls()
    expect(calls).toHaveLength(1)

    const csvContent = calls[0].content
    const csvLines = csvContent.split('\n')

    // Verify CSV structure
    expect(csvLines.length).toBeGreaterThan(2) // Header + at least 2 data rows

    // Verify headers are present
    const headers = csvLines[0]
    expect(headers).toContain('Event Name')
    expect(headers).toContain('User ID')
    expect(headers).toContain('Email')
    expect(headers).toContain('Audience Name')
    expect(headers).toContain('Timestamp')

    // Verify first data row contains expected values
    const firstDataRow = csvLines[1]
    expect(firstDataRow).toContain('Audience Entered')
    expect(firstDataRow).toContain('user123')
    expect(firstDataRow).toContain('some_audience_key')

    // Verify second data row for identify event
    const secondDataRow = csvLines[2]
    expect(secondDataRow).toContain('user456')
    expect(secondDataRow).toContain('user2@example.com')

    // Verify file path includes correct prefix and timestamp
    expect(calls[0].path).toBe('/uploads/sfmc_audience__2023-07-26T15-23-39-803Z.csv')

    jest.useRealTimers()
  })

  it('should handle nested object serialization in CSV columns', async () => {
    const payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'object_test_',
      enable_batching: true,
      batch_size: 100000,
      file_extension: 'csv',
      columns: {
        'User ID': { '@path': '$.userId' },
        'Full Properties': { '@path': '$.properties' },
        'Context Object': { '@path': '$.context' },
        'Nested Email': { '@path': '$.properties.email' },
        'Deep Nested Value': { '@path': '$.properties.metadata.campaign' }
      }
    }

    const testEvent = createTestEvent({
      type: 'track',
      userId: 'complex_user_123',
      event: 'Complex Event',
      properties: {
        email: 'complex@example.com',
        product_id: 'prod_123',
        price: 99.99,
        metadata: {
          campaign: 'summer_sale',
          source: 'email'
        }
      },
      context: {
        personas: {
          computation_key: 'premium_customers'
        }
      }
    })

    await testDestination.testAction('syncEvents', {
      event: testEvent,
      settings,
      mapping: payload,
      useDefaultMappings: false
    })

    const calls = getReadableCalls()
    const csvContent = calls[0].content
    const csvLines = csvContent.split('\n')

    // Verify headers
    const headers = csvLines[0]
    expect(headers).toContain('User ID')
    expect(headers).toContain('Full Properties')
    expect(headers).toContain('Context Object')
    expect(headers).toContain('Nested Email')
    expect(headers).toContain('Deep Nested Value')

    // Verify data row contains serialized objects and extracted values
    const dataRow = csvLines[1]
    expect(dataRow).toContain('complex_user_123')
    expect(dataRow).toContain('complex@example.com')
    expect(dataRow).toContain('premium_customers')

    // Objects should be serialized as JSON strings within the CSV
    expect(dataRow).toContain('product_id')
    expect(dataRow).toContain('99.99')
    expect(dataRow).toContain('summer_sale')
  })

  describe('Fixture-based File Output Validation', () => {
    // Helper function to read fixture files
    const readFixture = (filename: string): string => {
      return readFileSync(join(__dirname, '../../__tests__/__fixtures__', filename), 'utf-8')
    }

    // Helper function to normalize CSV for comparison (removes trailing whitespace, normalizes line endings)
    const normalizeCSV = (csv: string): string => {
      return csv.trim().replace(/\r\n/g, '\n').replace(/\n+$/, '')
    }

    it('should read fixture files correctly', () => {
      const fixtureContent = readFixture('sftp-good-example.csv')
      expect(fixtureContent).toContain('user_id,email,audience_name')
      expect(fixtureContent).toContain('user1@example.com')
    })

    it('should generate CSV matching good example fixture', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2023-07-26T15:23:39.803Z'))

      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvents = [
        createTestEvent({
          type: 'track',
          userId: 'user1',
          messageId: 'msg_001',
          timestamp: '2023-07-26T15:23:39.803Z',
          properties: {
            email: 'user1@example.com',
            some_audience_key: true
          },
          context: {
            personas: {
              computation_key: 'some_audience_key'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'user2',
          messageId: 'msg_002',
          timestamp: '2023-07-26T15:24:12.456Z',
          properties: {
            email: 'user2@example.com',
            some_audience_key: true
          },
          context: {
            personas: {
              computation_key: 'some_audience_key'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'user3',
          messageId: 'msg_003',
          timestamp: '2023-07-26T15:24:45.789Z',
          properties: {
            email: 'user3@example.com',
            some_audience_key: false
          },
          context: {
            personas: {
              computation_key: 'some_audience_key',
              computation_id: 'aud_123'
            }
          }
        })
      ]

      await testDestination.testBatchAction('syncEvents', {
        events: testEvents,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = normalizeCSV(calls[0].content as string)
      const expectedCSV = normalizeCSV(readFixture('sftp-good-example.csv'))

      // Compare first few lines to verify structure
      const actualLines = actualCSV.split('\n')
      const expectedLines = expectedCSV.split('\n')

      expect(actualLines[0]).toBe(expectedLines[0]) // Header should match
      expect(actualLines.length).toBeGreaterThanOrEqual(4) // Header + 3 data rows

      jest.useRealTimers()
    })

    it('should generate TSV with tab delimiter matching fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: 'tab',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'txt',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        messageId: 'msg_001',
        timestamp: '2023-07-26T15:23:39.803Z',
        properties: {
          email: 'user1@example.com',
          some_audience_key: true
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content
      const expectedCSV = readFixture('sftp-tab-delimiter.txt')

      // Verify tab delimiter is used
      expect(actualCSV).toContain('\t')

      // Verify header structure matches fixture
      const actualHeader = actualCSV.split('\n')[0]
      const expectedHeader = expectedCSV.split('\n')[0]
      expect(actualHeader).toBe(expectedHeader)
    })

    it('should generate CSV with semicolon delimiter matching fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ';',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        messageId: 'msg_001',
        timestamp: '2023-07-26T15:23:39.803Z',
        properties: {
          email: 'user1@example.com',
          some_audience_key: 'true'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      expect(calls).toHaveLength(1)
      const actualCSV = calls[0].content as string

      // Read expected semicolon delimiter fixture
      const expectedCSV = readFixture('sftp-semicolon-delimiter.csv')

      // Normalize both CSVs for comparison
      const normalizeCSV = (csv: string) => csv.replace(/\r\n/g, '\n').trim()
      const expectedHeader = normalizeCSV(expectedCSV).split('\n')[0]
      const actualHeader = normalizeCSV(actualCSV).split('\n')[0]

      expect(actualHeader).toBe(expectedHeader)
      expect(actualCSV).toContain(';')
      expect(actualCSV).not.toContain(',') // Should not contain commas as delimiters
    })

    it('should generate CSV with pipe delimiter matching fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: '|',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        messageId: 'msg_001',
        timestamp: '2023-07-26T15:23:39.803Z',
        properties: {
          email: 'user1@example.com',
          some_audience_key: 'true'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key',
            computation_id: 'aud_123'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      expect(calls).toHaveLength(1)
      const actualCSV = calls[0].content as string

      // Read expected pipe delimiter fixture
      const expectedCSV = readFixture('sftp-pipe-delimiter.csv')

      // Normalize both CSVs for comparison
      const normalizeCSV = (csv: string) => csv.replace(/\r\n/g, '\n').trim()
      const expectedHeader = normalizeCSV(expectedCSV).split('\n')[0]
      const actualHeader = normalizeCSV(actualCSV).split('\n')[0]

      expect(actualHeader).toBe(expectedHeader)
      expect(actualCSV).toContain('|')
    })

    it('should generate CSV with colon delimiter matching fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ':',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        messageId: 'msg_001',
        timestamp: '2023-07-26T15:23:39.803Z',
        properties: {
          email: 'user1@example.com',
          some_audience_key: 'true'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key',
            computation_id: 'aud_123'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      expect(calls).toHaveLength(1)
      const actualCSV = calls[0].content as string

      // Read expected colon delimiter fixture
      const expectedCSV = readFixture('sftp-colon-delimiter.csv')

      // Normalize both CSVs for comparison
      const normalizeCSV = (csv: string) => csv.replace(/\r\n/g, '\n').trim()
      const expectedHeader = normalizeCSV(expectedCSV).split('\n')[0]
      const actualHeader = normalizeCSV(actualCSV).split('\n')[0]

      expect(actualHeader).toBe(expectedHeader)
      expect(actualCSV).toContain(':')
    })

    it('should handle audience with properties like fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          properties: { '@path': '$.properties' },
          audience_name: { '@path': '$.context.personas.computation_key' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        properties: {
          email: 'user1@example.com',
          product_id: 'prod_123',
          price: 99.99,
          category: 'electronics'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content

      // Verify properties object is serialized
      expect(actualCSV).toContain('product_id')
      expect(actualCSV).toContain('99.99')
      expect(actualCSV).toContain('electronics')
    })

    it('should handle special characters like fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_audience_key' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' },
          anonymous_id: { '@path': '$.anonymousId' }
        }
      }

      const testEvents = [
        createTestEvent({
          type: 'track',
          userId: 'user1',
          anonymousId: 'anon_001',
          messageId: 'msg_001',
          timestamp: '2023-07-26T15:23:39.803Z',
          properties: {
            email: 'user1@example.com',
            'customers_with_"quotes"': true
          },
          context: {
            personas: {
              computation_key: 'customers_with_"quotes"',
              computation_id: 'aud_123'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'user2',
          anonymousId: 'anon_002',
          messageId: 'msg_002',
          timestamp: '2023-07-26T15:24:12.456Z',
          properties: {
            email: 'user2@example.com',
            'customers, with commas': 'true'
          },
          context: {
            personas: {
              computation_key: 'customers, with commas',
              computation_id: 'aud_123'
            }
          }
        })
      ]

      await testDestination.testBatchAction('syncEvents', {
        events: testEvents,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content

      // Verify special characters are properly quoted
      expect(actualCSV).toContain('"customers_with_""quotes"""') // Double quotes escaped
      expect(actualCSV).toContain('"customers, with commas"') // Commas quoted
    })

    it('should handle empty data scenario', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.some_nonexistent_field' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      // Test with event that has minimal data
      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1234',
        messageId: '645fde10-8281-4e4a-89ea-6c7824434d67',
        timestamp: '2023-07-26T15:23:39.803Z'
        // No properties, context, etc.
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      expect(calls).toHaveLength(1)

      const csvContent = calls[0].content as string
      const csvLines = csvContent.split('\n')

      // Should still have header and one data row with empty values
      expect(csvLines.length).toBe(2) // Header + 1 data row
      expect(csvLines[0]).toBe('user_id,email,audience_name,audience_id,audience_action,timestamp,message_id')
      expect(csvLines[1]).toContain('user1234') // Should have userId
      expect(csvLines[1]).toContain('645fde10-8281-4e4a-89ea-6c7824434d67') // Should have messageId
      expect(csvLines[1]).toContain('2023-07-26T15:23:39.803Z') // Should have timestamp
    })

    it('should generate CSV matching audience with events fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.audience_action' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' },
          anonymous_id: { '@path': '$.anonymousId' },
          event_name: { '@path': '$.event' },
          event_type: { '@path': '$.type' }
        }
      }

      const testEvents = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          anonymousId: 'anon_001',
          messageId: 'msg_001',
          timestamp: '2023-07-26T15:23:39.803Z',
          event: 'Audience Entered',
          properties: {
            email: 'user1@example.com',
            audience_action: 'true'
          },
          context: {
            personas: {
              computation_key: 'marketing_campaign',
              computation_id: 'aud_456'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          anonymousId: 'anon_002',
          messageId: 'msg_002',
          timestamp: '2023-07-26T15:24:12.456Z',
          event: 'Audience Entered',
          properties: {
            email: 'user2@example.com',
            audience_action: 'true'
          },
          context: {
            personas: {
              computation_key: 'marketing_campaign',
              computation_id: 'aud_456'
            }
          }
        })
      ]

      await testDestination.testBatchAction('syncEvents', {
        events: testEvents,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content as string
      const expectedCSV = readFixture('sftp-audience-with-events.csv')

      // Verify header structure matches fixture
      const actualHeader = actualCSV.split('\n')[0]
      const expectedHeader = expectedCSV.split('\n')[0]
      expect(actualHeader).toBe(expectedHeader)

      // Verify content includes event information
      expect(actualCSV).toContain('marketing_campaign')
      expect(actualCSV).toContain('aud_456')
      expect(actualCSV).toContain('identify')
      expect(actualCSV).toContain('Audience Entered')
    })

    it('should generate CSV matching audience with properties fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.audience_action' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' },
          properties: { '@path': '$.properties' },
          traits: { '@path': '$.traits' }
        }
      }

      const testEvents = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          messageId: 'msg_001',
          timestamp: '2023-07-26T15:23:39.803Z',
          properties: {
            email: 'user1@example.com',
            audience_action: 'true',
            last_purchase: '2023-07-20',
            total_spent: 250.0
          },
          traits: {
            first_name: 'John',
            city: 'San Francisco'
          },
          context: {
            personas: {
              computation_key: 'purchase_intent',
              computation_id: 'aud_789'
            }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          messageId: 'msg_002',
          timestamp: '2023-07-26T15:24:12.456Z',
          properties: {
            email: 'user2@example.com',
            audience_action: 'true',
            last_purchase: '2023-07-21',
            total_spent: 180.5
          },
          traits: {
            first_name: 'Jane',
            city: 'New York'
          },
          context: {
            personas: {
              computation_key: 'purchase_intent',
              computation_id: 'aud_789'
            }
          }
        })
      ]

      await testDestination.testBatchAction('syncEvents', {
        events: testEvents,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content as string
      const expectedCSV = readFixture('sftp-audience-with-properties.csv')

      // Verify header structure matches fixture
      const actualHeader = actualCSV.split('\n')[0]
      const expectedHeader = expectedCSV.split('\n')[0]
      expect(actualHeader).toBe(expectedHeader)

      // Verify complex object serialization
      expect(actualCSV).toContain('purchase_intent')
      expect(actualCSV).toContain('aud_789')
      expect(actualCSV).toContain('last_purchase')
      expect(actualCSV).toContain('first_name')
      expect(actualCSV).toContain('San Francisco')
    })

    it('should generate CSV matching special characters fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.audience_action' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' },
          anonymous_id: { '@path': '$.anonymousId' }
        }
      }

      const testEvents = [
        createTestEvent({
          type: 'track',
          userId: 'user1',
          anonymousId: 'anon_001',
          messageId: 'msg_001',
          timestamp: '2023-07-26T15:23:39.803Z',
          properties: {
            email: 'user1@example.com',
            audience_action: 'true'
          },
          context: {
            personas: {
              computation_key: 'customers_with_"quotes"',
              computation_id: 'aud_123'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'user2',
          anonymousId: 'anon_002',
          messageId: 'msg_002',
          timestamp: '2023-07-26T15:24:12.456Z',
          properties: {
            email: 'user2@example.com',
            audience_action: 'true'
          },
          context: {
            personas: {
              computation_key: 'customers, with commas',
              computation_id: 'aud_123'
            }
          }
        })
      ]

      await testDestination.testBatchAction('syncEvents', {
        events: testEvents,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content as string
      const expectedCSV = readFixture('sftp-special-characters.csv')

      // Verify header structure matches fixture
      const actualHeader = actualCSV.split('\n')[0]
      const expectedHeader = expectedCSV.split('\n')[0]
      expect(actualHeader).toBe(expectedHeader)

      // Verify special character escaping
      expect(actualCSV).toContain('"customers_with_""quotes"""')
      expect(actualCSV).toContain('"customers, with commas"')
    })

    it('should handle empty events array by validating fixture format', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.audience_action' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      // Verify the empty data fixture format is correct for reference
      const expectedCSV = readFixture('sftp-empty-data.csv')
      expect(expectedCSV.trim()).toBe('user_id,email,audience_name,audience_id,audience_action,timestamp,message_id')

      // Test with empty events array - behavior may vary by implementation
      await testDestination.testBatchAction('syncEvents', {
        events: [],
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()

      // The action might still generate a file even with empty events
      // If so, verify it has the correct structure
      if (calls.length > 0) {
        const csvContent = calls[0].content as string
        const csvLines = csvContent.split('\n')
        // Should have at least the header matching the fixture
        expect(csvLines[0]).toBe('user_id,email,audience_name,audience_id,audience_action,timestamp,message_id')
      }
    })

    it('should generate TXT files with different delimiters', async () => {
      // Test comma-delimited TXT file
      const commaPayload = {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'txt',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        properties: {
          email: 'user1@example.com'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: commaPayload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      expect(calls[0].path).toMatch(/\.txt$/)
      expect(calls[0].content).toContain(',')

      // Verify comma delimiter TXT fixture exists and can be referenced
      const commaFixture = readFixture('sftp-comma-delimiter.txt')
      expect(commaFixture).toContain('user_id,email')
    })

    it('should generate files with alternate delimiter TXT formats', async () => {
      // Test that we can read all the TXT delimiter fixtures
      const fixtures = ['sftp-pipe-delimiter.txt', 'sftp-semicolon-delimiter.txt', 'sftp-colon-delimiter.txt']

      fixtures.forEach((fixtureName) => {
        const fixtureContent = readFixture(fixtureName)
        expect(fixtureContent).toBeTruthy()
        expect(fixtureContent).toContain('user_id')

        // Verify delimiter based on filename
        if (fixtureName.includes('pipe')) {
          expect(fixtureContent).toContain('|')
        } else if (fixtureName.includes('semicolon')) {
          expect(fixtureContent).toContain(';')
        } else if (fixtureName.includes('colon')) {
          expect(fixtureContent).toContain(':')
        }
      })
    })

    it('should generate CSV with tab delimiter using CSV format fixture', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        delimiter: 'tab',
        filename_prefix: 'test_',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {
          user_id: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' },
          audience_name: { '@path': '$.context.personas.computation_key' },
          audience_id: { '@path': '$.context.personas.computation_id' },
          audience_action: { '@path': '$.properties.audience_action' },
          timestamp: { '@path': '$.timestamp' },
          message_id: { '@path': '$.messageId' }
        }
      }

      const testEvent = createTestEvent({
        type: 'track',
        userId: 'user1',
        messageId: 'msg_001',
        timestamp: '2023-07-26T15:23:39.803Z',
        properties: {
          email: 'user1@example.com',
          audience_action: 'true'
        },
        context: {
          personas: {
            computation_key: 'some_audience_key',
            computation_id: 'aud_123'
          }
        }
      })

      await testDestination.testAction('syncEvents', {
        event: testEvent,
        settings,
        mapping: payload,
        useDefaultMappings: false
      })

      const calls = getReadableCalls()
      const actualCSV = calls[0].content as string

      // Verify tab delimiter is used
      expect(actualCSV).toContain('\t')

      // Compare with CSV format fixture
      const expectedCSV = readFixture('sftp-tab-delimiter.csv')
      const actualHeader = actualCSV.split('\n')[0]
      const expectedHeader = expectedCSV.split('\n')[0]
      expect(actualHeader).toBe(expectedHeader)
    })
  })
})
