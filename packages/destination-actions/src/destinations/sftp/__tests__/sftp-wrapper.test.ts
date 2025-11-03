import { SFTPWrapper } from '../client'
import Client from 'ssh2-sftp-client'

// Mock the ssh2-sftp-client module
jest.mock('ssh2-sftp-client')

describe('SFTPWrapper', () => {
  let wrapper: SFTPWrapper
  let mockSftp: jest.Mocked<Client>
  let mockClient: any
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }

  // Increase Jest timeout for all tests in this file
  jest.setTimeout(20000)

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mocks for the SFTP client and its underlying ssh2 SFTPWrapper
    mockClient = {
      open: jest.fn().mockImplementation((_path, _mode, callback) => {
        callback(null, 'file-handle')
      }),
      write: jest.fn().mockImplementation((_handle, _buffer, _offset, _length, _position, callback) => {
        callback(null)
      }),
      close: jest.fn().mockImplementation((_handle, callback) => {
        callback(null)
      })
    }

    mockSftp = new Client() as jest.Mocked<Client>
    mockSftp.connect = jest.fn().mockResolvedValue(mockClient)
    mockSftp.put = jest.fn().mockResolvedValue('success')
    mockSftp.end = jest.fn().mockResolvedValue(undefined)

    // Replace the Client constructor with our mock
    ;(Client as unknown as jest.Mock).mockImplementation(() => mockSftp)

    // Create a wrapper instance for testing
    wrapper = new SFTPWrapper('test', mockLogger as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect successfully', async () => {
      const options = { host: 'test.host', port: 22, username: 'user', password: 'password' }

      const result = await wrapper.connect(options)

      expect(mockSftp.connect).toHaveBeenCalledWith(options)
      expect(result).toBe(mockClient)
    })

    it('should log and throw errors on connect failure', async () => {
      const error = new Error('Connection failed')
      mockSftp.connect.mockRejectedValue(error)
      const options = { host: 'test.host', port: 22, username: 'user', password: 'password' }

      await expect(wrapper.connect(options)).rejects.toThrow('Connection failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to SFTP server:', 'Error: Connection failed')
    })
  })

  describe('put', () => {
    const buffer = Buffer.from('test data')
    const remotePath = '/remote/path/file.txt'

    it('should throw error if not connected', async () => {
      // Simulate client not being initialized
      mockSftp.connect.mockRejectedValue(new Error('Connection failed'))

      try {
        await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      } catch (e) {
        // Expected error, ignore
      }

      await expect(wrapper.put(buffer, remotePath)).rejects.toThrow('SFTP Client not connected')
    })

    it('should upload file successfully', async () => {
      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      const result = await wrapper.put(buffer, remotePath)

      expect(mockSftp.put).toHaveBeenCalledWith(buffer, remotePath, {})
      expect(result).toBe('success')
    })

    it('should log and throw errors on put failure', async () => {
      const error = new Error('Upload failed')
      mockSftp.put.mockRejectedValue(error)

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      await expect(wrapper.put(buffer, remotePath)).rejects.toThrow('Upload failed')
      expect(mockLogger.error).toHaveBeenCalledWith('Error uploading file to SFTP server:', 'Error: Upload failed')
    })
  })

  describe('fastPutFromBuffer', () => {
    // Use a smaller buffer to prevent timeout issues
    const buffer = Buffer.from('test')
    const remotePath = '/remote/path/file.txt'

    it('should throw error if not connected', async () => {
      // Simulate client not being initialized
      mockSftp.connect.mockRejectedValue(new Error('Connection failed'))

      try {
        await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      } catch (e) {
        // Expected error, ignore
      }

      await expect(wrapper.fastPutFromBuffer(buffer, remotePath)).rejects.toThrow('SFTP Client not connected')
    })

    it('should upload file with default options and handle file operations', async () => {
      // Setup spies to verify callback behavior
      const openSpy = jest.fn((_path, _mode, callback) => {
        callback(null, 'file-handle')
      })

      const writeSpy = jest.fn((_handle, _buffer, _offset, _length, _position, callback) => {
        callback(null)
      })

      const closeSpy = jest.fn((_handle, callback) => {
        callback(null)
      })

      // Set up the mock implementation
      mockClient.open = openSpy
      mockClient.write = writeSpy
      mockClient.close = closeSpy

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      await wrapper.fastPutFromBuffer(buffer, remotePath)

      // Verify callbacks were called as expected
      expect(openSpy).toHaveBeenCalledWith(remotePath, 'w', expect.any(Function))
      expect(writeSpy).toHaveBeenCalled()
      expect(closeSpy).toHaveBeenCalled()
    })

    it('should respect custom concurrency and chunk size', async () => {
      // Use a very small chunk size to ensure multiple chunks
      const customConcurrency = 1
      const customChunkSize = 1 // 1 byte at a time
      const testBuffer = Buffer.from('abc') // 3 bytes

      let writeCount = 0

      // Set up mocks that will complete immediately
      mockClient.open = jest.fn((_path, _mode, callback) => {
        callback(null, 'file-handle')
      })

      mockClient.write = jest.fn((_handle, _buffer, _offset, _length, _position, callback) => {
        writeCount++
        callback(null)
      })

      mockClient.close = jest.fn((_handle, callback) => {
        callback(null)
      })

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })

      await wrapper.fastPutFromBuffer(testBuffer, remotePath, {
        concurrency: customConcurrency,
        chunkSize: customChunkSize
      })

      // With 3 bytes and 1 byte chunk size, should have 3 writes
      expect(writeCount).toBe(3)
      expect(mockClient.close).toHaveBeenCalled()
    })

    it('should handle file opening errors', async () => {
      // Mock open to simulate an error
      const openError = new Error('Failed to open file')
      mockClient.open = jest.fn((_path, _mode, callback) => {
        callback(openError, null)
      })

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })

      await expect(wrapper.fastPutFromBuffer(buffer, remotePath)).rejects.toThrow('Error opening remote file')
      expect(mockClient.open).toHaveBeenCalledWith(remotePath, 'w', expect.any(Function))
    })

    it('should handle write errors during transfer', async () => {
      // Mock open to return a handle
      mockClient.open = jest.fn((_path, _mode, callback) => {
        callback(null, 'file-handle')
      })

      // Mock write to fail immediately
      const writeError = new Error('Write failed')
      mockClient.write = jest.fn((_handle, _buffer, _offset, _length, _position, callback) => {
        callback(writeError)
      })

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })

      await expect(wrapper.fastPutFromBuffer(buffer, remotePath)).rejects.toThrow('Error writing to remote file')
    })

    it('should handle close errors gracefully', async () => {
      // Mock open to return a handle immediately
      mockClient.open = jest.fn((_path, _mode, callback) => {
        callback(null, 'file-handle')
      })

      // Mock write to succeed immediately
      mockClient.write = jest.fn((_handle, _buffer, _offset, _length, _position, callback) => {
        callback(null)
      })

      // Mock close to fail
      const closeError = new Error('Close failed')
      mockClient.close = jest.fn((_handle, callback) => {
        callback(closeError)
      })

      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })

      // Should not reject since the transfer was successful even if close failed
      await wrapper.fastPutFromBuffer(buffer, remotePath)

      // Should log the close error
      expect(mockLogger.warn).toHaveBeenCalledWith('Error closing remote file handle:', 'Close failed')
    })
  })

  describe('end', () => {
    it('should end the SFTP connection', async () => {
      await wrapper.connect({ host: 'test', port: 22, username: 'user', password: 'pass' })
      await wrapper.end()

      expect(mockSftp.end).toHaveBeenCalled()
    })

    it('should clean up even if not connected', async () => {
      // Don't connect first
      await wrapper.end()

      // Should still call end
      expect(mockSftp.end).toHaveBeenCalled()
    })
  })
})
