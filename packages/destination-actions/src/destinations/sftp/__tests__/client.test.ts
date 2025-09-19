import { normalizeSSHKey, testSFTPConnection, uploadSFTP } from '../client'
import { SFTP_DEFAULT_PORT } from '../constants'
import { Settings } from '../generated-types'

import Client from 'ssh2-sftp-client'

jest.mock('ssh2-sftp-client')

// Shared test data and helpers
const passwordSettings: Settings = {
  auth_type: 'password',
  sftp_host: 'sftp_host',
  sftp_username: 'sftp_username',
  sftp_password: 'sftp_password',
  sftp_port: SFTP_DEFAULT_PORT
}

const sshKeySettings: Settings = {
  auth_type: 'ssh_key',
  sftp_host: 'sftp_host',
  sftp_username: 'sftp_username',
  sftp_ssh_key: 'sftp_ssh_key',
  sftp_port: SFTP_DEFAULT_PORT
}

describe('SFTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('uploadSFTP success cases', () => {
    beforeEach(() => {
      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.put = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)
    })

    it('uploads file successfully with password authentication', async () => {
      await uploadSFTP(passwordSettings, 'sftp_folder_path', 'filename', Buffer.from('test content'))

      expect(Client.prototype.connect).toHaveBeenCalledWith({
        host: 'sftp_host',
        port: SFTP_DEFAULT_PORT,
        username: 'sftp_username',
        password: 'sftp_password'
      })
      expect(Client.prototype.put).toHaveBeenCalled()
    })

    it('uploads file successfully with SSH key authentication', async () => {
      await uploadSFTP(sshKeySettings, 'sftp_folder_path', 'filename', Buffer.from('test content'))

      expect(Client.prototype.connect).toHaveBeenCalledWith({
        host: 'sftp_host',
        port: SFTP_DEFAULT_PORT,
        username: 'sftp_username',
        privateKey: 'sftp_ssh_key'
      })
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

      // Should throw PayloadValidationError for NO_SUCH_FILE
      await expect(
        uploadSFTP(passwordSettings, '/nonexistent/path', 'filename', Buffer.from('test content'))
      ).rejects.toThrow('Could not find path: /nonexistent/path')
    })

    it('re-throws non-SFTP errors unchanged', async () => {
      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)

      // Mock generic error (not SFTP-specific)
      const genericError = new Error('Network error')
      Client.prototype.put = jest.fn().mockRejectedValue(genericError)

      // Should re-throw the generic error unchanged
      await expect(uploadSFTP(passwordSettings, '/uploads', 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Network error'
      )
    })

    it('should throw timeout error when timeout occurs but action completes (line 73 coverage)', async () => {
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

      // This should trigger the timeout immediately, set timeoutError,
      // then when put() completes, it should hit "if (timeoutError) throw timeoutError"
      await expect(uploadSFTP(passwordSettings, '/uploads', 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Did not complete SFTP operation under allotted time: 10000'
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

      // This should:
      // 1. Start the upload
      // 2. setTimeout callback executes immediately
      // 3. sftp.end() is called and fails, triggering console.error(err) ← LINE 63
      // 4. timeoutError is set
      // 5. When put() completes, SelfTimeoutError is thrown
      await expect(uploadSFTP(passwordSettings, '/uploads', 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Did not complete SFTP operation under allotted time: 10000'
      )

      // Verify that console.error was called with the error from sftp.end()
      expect(consoleSpy).toHaveBeenCalledWith(endError)

      consoleSpy.mockRestore()
      global.setTimeout = originalSetTimeout
    })
  })

  describe('normalizeSSHKey', () => {
    it('should return empty string for empty input', () => {
      expect(normalizeSSHKey('')).toBe('')
      expect(normalizeSSHKey()).toBe('')
    })

    it('should return properly formatted PEM key unchanged', () => {
      const properlyFormattedKey =
        `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN
OPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR
STUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV
-----END RSA PRIVATE KEY-----`

      expect(normalizeSSHKey(properlyFormattedKey)).toBe(properlyFormattedKey)
    })

    it('should normalize line endings from Windows CRLF to Unix LF', () => {
      const windowsKey = `-----BEGIN RSA PRIVATE KEY-----\r\nMIIEpAIBAAKCAQEA1234567890\r\n-----END RSA PRIVATE KEY-----\r\n` // gitleaks:allow
      const expectedKey = `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890\n-----END RSA PRIVATE KEY-----` // gitleaks:allow

      expect(normalizeSSHKey(windowsKey)).toBe(expectedKey)
    })

    it('should normalize line endings from Mac CR to Unix LF', () => {
      const macKey = `-----BEGIN RSA PRIVATE KEY-----\rMIIEpAIBAAKCAQEA1234567890\r-----END RSA PRIVATE KEY-----\r` // gitleaks:allow
      const expectedKey = `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890\n-----END RSA PRIVATE KEY-----` // gitleaks:allow

      expect(normalizeSSHKey(macKey)).toBe(expectedKey)
    })

    it('should trim whitespace from beginning and end', () => {
      const keyWithWhitespace =
        `   -----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890
-----END RSA PRIVATE KEY-----   `

      const expectedKey =
        `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890
-----END RSA PRIVATE KEY-----`

      expect(normalizeSSHKey(keyWithWhitespace)).toBe(expectedKey)
    })

    it('should reformat single-line key with proper PEM structure', () => {
      const singleLineKey = `-----BEGIN RSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV-----END RSA PRIVATE KEY-----` // gitleaks:allow

      const expectedKey =
        `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL
MNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN
OPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP
QRSTUV
-----END RSA PRIVATE KEY-----`

      expect(normalizeSSHKey(singleLineKey)).toBe(expectedKey)
    })

    it('should handle key with mixed whitespace and irregular formatting', () => {
      const messyKey =
        `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `   
      MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz    ABCDEFGHIJKLMN
   OPQRSTUVWXYZ1234567890   abcdefghijklmnopqrstuvwxyz 
		ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz
-----END RSA PRIVATE KEY-----`

      const result = normalizeSSHKey(messyKey)

      // Verify the key starts and ends with proper headers/footers
      expect(result).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/) // gitleaks:allow
      expect(result).toMatch(/\n-----END RSA PRIVATE KEY-----$/)

      // Verify that all content lines are 64 characters or less
      const lines = result.split('\n')
      const contentLines = lines.slice(1, -1) // Remove header and footer
      contentLines.forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(64)
      })

      // Verify we have content
      expect(contentLines.length).toBeGreaterThan(0)
      expect(contentLines.every((line) => line.length > 0)).toBe(true)
    })

    it('should handle different key types', () => {
      // Test DSA key
      const dsaKey = `-----BEGIN DSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END DSA PRIVATE KEY-----` // gitleaks:allow
      const expectedDsaKey =
        `-----BEGIN DSA PRIVATE KEY-----` +
        `\nMIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz\n-----END DSA PRIVATE KEY-----` // gitleaks:allow
      expect(normalizeSSHKey(dsaKey)).toBe(expectedDsaKey)

      // Test EC key
      const ecKey = `-----BEGIN EC PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END EC PRIVATE KEY-----` // gitleaks:allow
      const expectedEcKey =
        `-----BEGIN EC PRIVATE KEY-----` +
        `\nMIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz\n-----END EC PRIVATE KEY-----` // gitleaks:allow
      expect(normalizeSSHKey(ecKey)).toBe(expectedEcKey)

      // Test OpenSSH key
      const opensshKey = `-----BEGIN OPENSSH PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END OPENSSH PRIVATE KEY-----` // gitleaks:allow
      const expectedOpensshKey =
        `-----BEGIN OPENSSH PRIVATE KEY-----` +
        `\nMIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz\n-----END OPENSSH PRIVATE KEY-----` // gitleaks:allow
      expect(normalizeSSHKey(opensshKey)).toBe(expectedOpensshKey)
    })

    it('should split long content into 64-character lines', () => {
      // Use exactly 128 'A's to test the 64-character line splitting
      const longContentKey = `-----BEGIN RSA PRIVATE KEY-----${'A'.repeat(128)}-----END RSA PRIVATE KEY-----` // gitleaks:allow

      const result = normalizeSSHKey(longContentKey)
      const lines = result.split('\n')

      // Should have header, 2 content lines of 64 chars each, and footer
      expect(lines.length).toBe(4)
      expect(lines[0]).toBe('-----BEGIN RSA PRIVATE KEY-----') // gitleaks:allow
      expect(lines[1]).toBe('A'.repeat(64))
      expect(lines[2]).toBe('A'.repeat(64))
      expect(lines[3]).toBe('-----END RSA PRIVATE KEY-----')
    })

    it('should handle key with only header but no footer', () => {
      const keyWithoutFooter = `-----BEGIN RSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890` // gitleaks:allow

      // Should return as-is since it can't be properly parsed
      expect(normalizeSSHKey(keyWithoutFooter)).toBe(keyWithoutFooter)
    })

    it('should handle key with only footer but no header', () => {
      const keyWithoutHeader = `MIIEpAIBAAKCAQEA1234567890-----END RSA PRIVATE KEY-----`

      // Should return as-is since it can't be properly parsed
      expect(normalizeSSHKey(keyWithoutHeader)).toBe(keyWithoutHeader)
    })

    it('should handle malformed key without proper headers/footers', () => {
      const malformedKey = `This is not a valid SSH key at all`

      // Should return as-is since it can't be parsed
      expect(normalizeSSHKey(malformedKey)).toBe(malformedKey)
    })

    it('should handle key with mismatched header and footer types', () => {
      const mismatchedKey = `-----BEGIN RSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890-----END DSA PRIVATE KEY-----` // gitleaks:allow

      const expectedKey =
        `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890
-----END DSA PRIVATE KEY-----`

      // Should still format it since both header and footer patterns match
      expect(normalizeSSHKey(mismatchedKey)).toBe(expectedKey)
    })

    it('should remove trailing newlines from formatted content', () => {
      const keyWithTrailingChars = `-----BEGIN RSA PRIVATE KEY-----${'A'.repeat(64)}B-----END RSA PRIVATE KEY-----` // gitleaks:allow

      const result = normalizeSSHKey(keyWithTrailingChars)
      const lines = result.split('\n')

      // Should not end with empty lines
      expect(lines[lines.length - 1]).toBe('-----END RSA PRIVATE KEY-----')
      expect(lines[lines.length - 2]).toBe('B') // The remaining character after 64-char split
    })
  })

  describe('testSFTPConnection', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.clearAllTimers()
    })

    describe('success cases', () => {
      beforeEach(() => {
        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
        Client.prototype.list = jest.fn().mockResolvedValue([
          { name: 'file1.txt', type: '-' },
          { name: 'folder1', type: 'd' }
        ])
        Client.prototype.end = jest.fn().mockResolvedValue(undefined)
      })

      it('should test connection successfully with password authentication', async () => {
        const result = await testSFTPConnection(passwordSettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          password: 'sftp_password'
        })
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
        expect(result).toEqual([
          { name: 'file1.txt', type: '-' },
          { name: 'folder1', type: 'd' }
        ])
      })

      it('should test connection successfully with SSH key authentication', async () => {
        const result = await testSFTPConnection(sshKeySettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          privateKey: 'sftp_ssh_key'
        })
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
        expect(result).toEqual([
          { name: 'file1.txt', type: '-' },
          { name: 'folder1', type: 'd' }
        ])
      })

      it('should test connection successfully when root directory is empty', async () => {
        Client.prototype.list = jest.fn().mockResolvedValue([])

        const result = await testSFTPConnection(passwordSettings)

        expect(Client.prototype.connect).toHaveBeenCalled()
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
        expect(result).toEqual([])
      })

      it('should use normalized SSH key when testing connection', async () => {
        const settingsWithMalformedKey: Settings = {
          ...sshKeySettings,
          sftp_ssh_key: `-----BEGIN RSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN-----END RSA PRIVATE KEY-----` // gitleaks:allow
        }

        await testSFTPConnection(settingsWithMalformedKey)

        // Should connect with normalized key (properly formatted with line breaks)
        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          privateKey:
            `-----BEGIN RSA PRIVATE KEY-----` + // gitleaks:allow
            `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL
MN
-----END RSA PRIVATE KEY-----` // gitleaks:allow
        })
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        Client.prototype.end = jest.fn().mockResolvedValue(undefined)
      })

      it('should throw auth error when connect fails', async () => {
        const authError = new Error('Authentication failed')
        Client.prototype.connect = jest.fn().mockRejectedValue(authError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('Authentication failed')
        expect(Client.prototype.connect).toHaveBeenCalled()
        // Note: end() is not called when connect() fails because the error occurs before the try-catch block
      })

      it('should throw network error when host unreachable', async () => {
        const connectionError = new Error('ENOTFOUND sftp_host')
        Client.prototype.connect = jest.fn().mockRejectedValue(connectionError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('ENOTFOUND sftp_host')
        expect(Client.prototype.connect).toHaveBeenCalled()
        // Note: end() is not called when connect() fails because the error occurs before the try-catch block
      })

      it('should throw PayloadValidationError for NO_SUCH_FILE SFTP error on list operation', async () => {
        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)

        // Mock SFTP error with NO_SUCH_FILE code on list operation
        const sftpError = new Error('No such file') as any
        sftpError.code = 2 // SFTPErrorCode.NO_SUCH_FILE
        Client.prototype.list = jest.fn().mockRejectedValue(sftpError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('Could not find path: /')
        expect(Client.prototype.connect).toHaveBeenCalled()
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
      })

      it('should re-throw non-SFTP errors unchanged from list operation', async () => {
        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)

        const genericError = new Error('Permission denied')
        Client.prototype.list = jest.fn().mockRejectedValue(genericError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('Permission denied')
        expect(Client.prototype.connect).toHaveBeenCalled()
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
      })

      it('should throw timeout error when operation takes too long', async () => {
        // Mock setTimeout to immediately execute the timeout callback
        const originalSetTimeout = global.setTimeout
        global.setTimeout = ((callback: Function) => {
          callback()
          return 123 as any
        }) as any

        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
        Client.prototype.list = jest.fn().mockResolvedValue([])
        Client.prototype.end = jest.fn().mockResolvedValue(undefined)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow(
          'Did not complete SFTP operation under allotted time: 10000'
        )

        global.setTimeout = originalSetTimeout
      })

      it('should handle connection errors with cleanup', async () => {
        const connectionError = new Error('Connection refused')
        Client.prototype.connect = jest.fn().mockRejectedValue(connectionError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('Connection refused')
        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          password: 'sftp_password'
        })
        // Note: end() is not called when connect() fails because the error occurs before the try-catch block
      })

      it('should handle list operation failure gracefully', async () => {
        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)

        const listError = new Error('Directory listing failed')
        Client.prototype.list = jest.fn().mockRejectedValue(listError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow('Directory listing failed')
        expect(Client.prototype.connect).toHaveBeenCalled()
        expect(Client.prototype.list).toHaveBeenCalledWith('/')
        expect(Client.prototype.end).toHaveBeenCalled()
      })

      it('should log error when sftp.end() fails during timeout cleanup', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

        // Mock setTimeout to immediately execute the timeout callback
        const originalSetTimeout = global.setTimeout
        global.setTimeout = ((callback: Function) => {
          callback()
          return 123 as any
        }) as any

        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
        Client.prototype.list = jest.fn().mockResolvedValue([])

        // Make sftp.end() fail during timeout cleanup
        const endError = new Error('Connection failed during cleanup')
        Client.prototype.end = jest.fn().mockRejectedValue(endError)

        await expect(testSFTPConnection(passwordSettings)).rejects.toThrow(
          'Did not complete SFTP operation under allotted time: 10000'
        )

        expect(consoleSpy).toHaveBeenCalledWith(endError)

        consoleSpy.mockRestore()
        global.setTimeout = originalSetTimeout
      })
    })

    describe('configuration variations', () => {
      beforeEach(() => {
        Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
        Client.prototype.list = jest.fn().mockResolvedValue([])
        Client.prototype.end = jest.fn().mockResolvedValue(undefined)
      })

      it('should use custom port when specified', async () => {
        const customPortSettings: Settings = {
          ...passwordSettings,
          sftp_port: 11
        }

        await testSFTPConnection(customPortSettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: 11,
          username: 'sftp_username',
          password: 'sftp_password'
        })
      })

      it('should default to port SFTP_DEFAULT_PORT when not specified', async () => {
        const noPortSettings: Settings = {
          ...passwordSettings,
          sftp_port: undefined
        }

        await testSFTPConnection(noPortSettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          password: 'sftp_password'
        })
      })

      it('should handle empty SSH key gracefully', async () => {
        const emptyKeySettings: Settings = {
          ...sshKeySettings,
          sftp_ssh_key: ''
        }

        await testSFTPConnection(emptyKeySettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          privateKey: ''
        })
      })

      it('should handle undefined SSH key gracefully', async () => {
        const undefinedKeySettings: Settings = {
          ...sshKeySettings,
          sftp_ssh_key: undefined
        }

        await testSFTPConnection(undefinedKeySettings)

        expect(Client.prototype.connect).toHaveBeenCalledWith({
          host: 'sftp_host',
          port: SFTP_DEFAULT_PORT,
          username: 'sftp_username',
          privateKey: ''
        })
      })
    })
  })
})
