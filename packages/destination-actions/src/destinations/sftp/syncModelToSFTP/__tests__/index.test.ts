import { createTestIntegration, SegmentEvent } from '@segment/actions-core'
import { Settings } from '../../generated-types'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const settings: Settings = {
  auth_type: 'password',
  sftp_host: 'test.example.com',
  sftp_username: 'testuser',
  sftp_password: 'testpass',
  sftp_port: 22
}

const payload = {
  sftp_folder_path: '/uploads',
  column1: 'test-audience',
  delimiter: ',',
  filename_prefix: 'segment_',
  enable_batching: true,
  batch_size: 100000,
  file_extension: 'csv'
}

const mockedRETLEvents: SegmentEvent[] = Array.from({ length: 50 }, (_, i) => ({
  messageId: `segment-test-message-00000${i + 2}`,
  timestamp: '2023-07-26T15:23:39.803Z',
  type: 'track',
  userId: `userid${i + 2}`,
  receivedAt: '2015-12-12T19:11:01.266Z',
  properties: {
    retlColumn1: `value${i + 2}`,
    retlColumn2: `value${i + 2}`,
    retlColumn3: `value${i + 2}`,
    retlColumn4: `value${i + 2}`,
    retlColumn5: `value${i + 2}`
  },
  event: 'new'
}))

// Mock the SFTP client
const mockSftpClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  put: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(true)
}

jest.mock('ssh2-sftp-client', () => jest.fn(() => mockSftpClient))

describe('syncModelToSFTP', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Reset mock implementations
    mockSftpClient.connect.mockResolvedValue(undefined)
    mockSftpClient.put.mockResolvedValue(undefined)
    mockSftpClient.end.mockResolvedValue(undefined)
    mockSftpClient.exists.mockResolvedValue(true)
  })

  describe('Single Event Processing', () => {
    it('should handle filename prefix by defaulting to csv', async () => {
      await expect(
        testDestination.testAction('syncModelToSFTP', {
          event: mockedRETLEvents[0],
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })
  })

  describe('Batch Processing', () => {
    it('should handle batch processing', async () => {
      await expect(
        testDestination.testBatchAction('syncModelToSFTP', {
          events: mockedRETLEvents,
          settings,
          mapping: payload,
          useDefaultMappings: true
        })
      ).resolves.not.toThrow()
    })
  })
})
