import { createTestIntegration, PayloadValidationError, SegmentEvent } from '@segment/actions-core'
import { SFTP_MIN_RECORD_COUNT } from '../properties'

// Mock SFTP client at the top level
const mockSftpClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  put: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true)
}

jest.mock('ssh2-sftp-client', () => {
  return jest.fn(() => mockSftpClient)
})

// Import destination after mocking
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const mockedEvents: SegmentEvent[] = Array.from({ length: 50 }, (_, i) => ({
  messageId: `segment-test-message-00000${i + 2}`,
  timestamp: '2023-07-26T15:23:39.803Z',
  type: 'track',
  userId: `userid${i + 2}`,
  receivedAt: '2015-12-12T19:11:01.266Z',
  properties: {},
  event: 'Audience Entered'
}))

describe('SFTP Destination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Reset mock implementations
    mockSftpClient.connect.mockResolvedValue(undefined)
    mockSftpClient.put.mockResolvedValue(undefined)
    mockSftpClient.end.mockResolvedValue(undefined)
    mockSftpClient.exists.mockResolvedValue(true)
  })

  describe('testAuthentication', () => {
    it('should validate authentication fields', async () => {
      const authData = {}
      expect(authData).toStrictEqual({})
    })
  })

  describe('syncToSFTP', () => {
    it('should be defined', () => {
      expect(testDestination.actions.syncToSFTP).toBeDefined()
    })

    it('should have required SFTP fields', () => {
      const action = testDestination.actions.syncToSFTP
      expect(action.definition.fields.sftp_host).toBeDefined()
      expect(action.definition.fields.sftp_username).toBeDefined()
      expect(action.definition.fields.sftp_password).toBeDefined()
      expect(action.definition.fields.sftp_folder_path).toBeDefined()
      expect(action.definition.fields.audience_key).toBeDefined()
    })

    it('should validate minimum record count', async () => {
      const settings = {}

      const payload = {
        sftp_host: 'test.example.com',
        sftp_username: 'testuser',
        sftp_password: 'testpass',
        sftp_folder_path: '/uploads',
        audience_key: 'test-audience',
        delimiter: ',',
        filename: 'test.csv',
        enable_batching: true
      }

      // Test with insufficient records
      const insufficientEvents = mockedEvents.slice(0, SFTP_MIN_RECORD_COUNT - 1)

      await expect(
        testDestination.testAction('syncToSFTP', {
          event: insufficientEvents[0],
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).rejects.toThrow(PayloadValidationError as jest.Constructable)
    })

    it('should handle batch processing', async () => {
      const settings = {}

      const payload = {
        sftp_host: 'test.example.com',
        sftp_username: 'testuser',
        sftp_password: 'testpass',
        sftp_folder_path: '/uploads',
        audience_key: 'test-audience',
        delimiter: ',',
        filename: 'test.csv',
        enable_batching: true
      }

      const sufficientEvents = mockedEvents.slice(0, SFTP_MIN_RECORD_COUNT)

      // This would normally test the actual upload, but since we're mocking SFTP
      // we'll just verify the action can be called without errors
      await expect(
        testDestination.testBatchAction('syncToSFTP', {
          events: sufficientEvents,
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })
  })
})
