import { SelfTimeoutError } from '@segment/actions-core'
import { uploadSFTP } from '../client'
import { Settings } from '../generated-types'
import { Payload } from '../syncToSFTP/generated-types'

import Client from 'ssh2-sftp-client'

jest.mock('ssh2-sftp-client')

// Shared test data and helpers
const settings: Settings = {
  sftp_host: 'sftp_host',
  sftp_username: 'sftp_username',
  sftp_password: 'sftp_password',
  sftp_port: 22
}

const createMockPayload = (overrides: Partial<Payload> = {}): Payload => ({
  sftp_folder_path: '/uploads',
  filename_prefix: 'filename',
  delimiter: 'delimiter',
  enable_batching: false,
  batch_size: 100000,
  file_extension: 'csv',
  columns: {},
  ...overrides
})

describe('SFTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('uploadSFTP success cases', () => {
    it('uploads file successfully', async () => {
      Client.prototype.connect = jest.fn()
      Client.prototype.put = jest.fn()
      Client.prototype.end = jest.fn()

      const mockPayload = createMockPayload({ sftp_folder_path: 'sftp_folder_path' })

      await uploadSFTP(settings, mockPayload, 'filename', Buffer.from('test content'))
      expect(Client.prototype.put).toHaveBeenCalled()
    })
  })

  describe('uploadSFTP error handling', () => {
    it('throws PayloadValidationError for NO_SUCH_FILE SFTP error', async () => {
      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)

      // Mock SFTP error with NO_SUCH_FILE code
      const sftpError = new Error('No such file') as any
      sftpError.code = 2 // SFTPErrorCode.NO_SUCH_FILE
      Client.prototype.put = jest.fn().mockRejectedValue(sftpError)

      const mockPayload = createMockPayload({ sftp_folder_path: '/nonexistent/path' })

      // Should throw PayloadValidationError for NO_SUCH_FILE
      await expect(uploadSFTP(settings, mockPayload, 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Could not find path: /nonexistent/path'
      )
    })

    it('re-throws non-SFTP errors unchanged', async () => {
      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)

      // Mock a generic error (not an SFTP error)
      const genericError = new Error('Generic network error')
      Client.prototype.put = jest.fn().mockRejectedValue(genericError)

      const mockPayload: Payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'filename',
        delimiter: 'delimiter',
        enable_batching: false,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // Should re-throw the original error
      await expect(uploadSFTP(settings, mockPayload, 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Generic network error'
      )
    })

    it('should throw SelfTimeoutError when timeout occurs but action completes (line 73 coverage)', async () => {
      // This test covers the specific line: if (timeoutError) throw timeoutError

      // Mock setTimeout to immediately execute the timeout callback and set timeoutError
      const originalSetTimeout = global.setTimeout
      global.setTimeout = ((callback: Function) => {
        // Execute the timeout callback immediately to set timeoutError
        callback()
        return 123 as any // Return a fake timer ID
      }) as any

      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)

      // Make put() resolve successfully but slowly (simulating the race condition)
      Client.prototype.put = jest.fn().mockResolvedValue(undefined)

      const mockPayload: Payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'filename',
        delimiter: 'delimiter',
        enable_batching: false,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // This should trigger the timeout immediately, set timeoutError,
      // then when put() completes, it should hit "if (timeoutError) throw timeoutError"
      await expect(uploadSFTP(settings, mockPayload, 'filename', Buffer.from('test content'))).rejects.toThrow(
        SelfTimeoutError
      )

      global.setTimeout = originalSetTimeout
    })

    it('should log error when sftp.end() fails during timeout cleanup (line 63 coverage)', async () => {
      // This test covers the specific line: console.error(err)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Mock setTimeout to immediately execute the timeout callback
      const originalSetTimeout = global.setTimeout
      global.setTimeout = ((callback: Function) => {
        // Execute the timeout callback immediately
        callback()
        return 123 as any // Return a fake timer ID
      }) as any

      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)

      // Make sftp.end() fail during timeout cleanup - this triggers console.error(err)
      const endError = new Error('Connection failed during cleanup')
      Client.prototype.end = jest.fn().mockRejectedValue(endError)

      // Make put() resolve successfully
      Client.prototype.put = jest.fn().mockResolvedValue(undefined)

      const mockPayload: Payload = {
        sftp_folder_path: '/uploads',
        filename_prefix: 'filename',
        delimiter: 'delimiter',
        enable_batching: false,
        batch_size: 100000,
        file_extension: 'csv',
        columns: {}
      }

      // This should:
      // 1. Start the upload
      // 2. setTimeout callback executes immediately
      // 3. sftp.end() is called and fails, triggering console.error(err) ← LINE 63
      // 4. timeoutError is set
      // 5. When put() completes, SelfTimeoutError is thrown
      await expect(uploadSFTP(settings, mockPayload, 'filename', Buffer.from('test content'))).rejects.toThrow(
        SelfTimeoutError
      )

      // Verify that console.error was called with the error from sftp.end()
      expect(consoleSpy).toHaveBeenCalledWith(endError)

      consoleSpy.mockRestore()
      global.setTimeout = originalSetTimeout
    })
  })
})
