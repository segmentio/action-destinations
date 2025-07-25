import { createTestIntegration, DEFAULT_REQUEST_TIMEOUT, PayloadValidationError } from '@segment/actions-core'
import { uploadSFTP, validateSFTP } from '../client'
import { Settings } from '../generated-types'

// Single unified mock for ssh2-sftp-client
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

const settings = {
  sftp_host: 'test.example.com',
  sftp_username: 'testuser',
  sftp_password: 'testpass',
  sftp_port: 22
}

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
    it('should validate authentication fields with valid credentials', async () => {
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should reject authentication with missing password', async () => {
      const settings = {
        sftp_host: 'test.example.com',
        sftp_username: 'testuser',
        sftp_port: 22
      } as Settings

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError()
    })
  })
})

describe('validateSFTP', () => {
  const payload = {
    sftp_folder_path: '/uploads',
    delimiter: ',',
    filename_prefix: 'test_filename_',
    enable_batching: true,
    batch_size: 100000,
    file_extension: 'csv',
    columns: {}
  }

  it('should throw if no sftp_username is provided', async () => {
    const settings = {}
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => validateSFTP(settings as any, payload)).toThrow('Missing Required SFTP Credentials (Username)')
  })

  it('should throw if no sftp_password is provided', async () => {
    const settings = { sftp_username: 'testuser' }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => validateSFTP(settings as any, payload)).toThrow('Missing Required SFTP Credentials (Password)')
  })

  it('should throw if no sftp_host is provided', async () => {
    const settings = {
      sftp_username: 'testuser',
      sftp_password: 'testpass'
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => validateSFTP(settings as any, payload)).toThrow('Missing Required SFTP host')
  })

  it('should throw if no folder path is provided in payload', async () => {
    const payload = {}
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => validateSFTP(settings, payload as any)).toThrow('Missing Required SFTP folder path')
  })

  it('should not throw when all required fields are present', async () => {
    expect(() => validateSFTP(settings, payload)).not.toThrow()
  })

  describe('uploadSFTP error handling', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should throw a PayloadValidationError when file path does not exist', async () => {
      const payload = {
        sftp_folder_path: '/nonexistent/path',
        filename_prefix: 'test_',
        delimiter: ',',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Mock SFTP client to throw NO_SUCH_FILE error
      mockSftpClient.put.mockRejectedValue({ code: 2, message: 'No such file' })

      await expect(uploadSFTP(settings, payload, 'test.csv', Buffer.from('test'))).rejects.toThrow(
        PayloadValidationError as jest.Constructable
      )
    })

    it('should re-throw non-SFTP errors without modification', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'test_',
        delimiter: ',',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Mock SFTP client to throw a generic error (not an SFTP error)
      const genericError = new Error('Connection timeout')
      mockSftpClient.put.mockRejectedValue(genericError)

      await expect(uploadSFTP(settings, payload, 'test.csv', Buffer.from('test'))).rejects.toThrow('Connection timeout')
    })

    it('should re-throw SFTP errors with unknown codes', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'test_',
        delimiter: ',',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Mock SFTP client to throw an SFTP error with unknown code
      const unknownSftpError = { code: 99, message: 'Unknown SFTP error' }
      mockSftpClient.put.mockRejectedValue(unknownSftpError)

      await expect(uploadSFTP(settings, payload, 'test.csv', Buffer.from('test'))).rejects.toEqual(unknownSftpError)
    })

    it('should re-throw connection errors', async () => {
      const payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'test_',
        delimiter: ',',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Mock SFTP client connection to fail
      const connectionError = new Error('Connection refused')
      mockSftpClient.connect.mockRejectedValue(connectionError)

      await expect(uploadSFTP(settings, payload, 'test.csv', Buffer.from('test'))).rejects.toThrow('Connection refused')
    })

    // it('should throw timeout error when operation completes after timeout', async () => {})
    it('should handle timeout error scenario', async () => {
      // Test that the timeout mechanism is set up correctly
      const mockSetTimeout = jest.spyOn(global, 'setTimeout')
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout')

      const payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'test_',
        delimiter: ',',
        enable_batching: true,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Ensure mocks are properly set up
      mockSftpClient.connect.mockResolvedValue(undefined)
      mockSftpClient.put.mockResolvedValue(undefined)
      mockSftpClient.end.mockResolvedValue(undefined)

      await uploadSFTP(settings, payload, 'test.csv', Buffer.from('test'))

      // Verify timeout was set and cleared
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), DEFAULT_REQUEST_TIMEOUT)
      expect(mockClearTimeout).toHaveBeenCalled()

      mockSetTimeout.mockRestore()
      mockClearTimeout.mockRestore()
    })
  })
})
