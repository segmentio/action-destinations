import { normalizeSSHKey, uploadSFTP } from '../client'
import { Settings } from '../generated-types'

import Client from 'ssh2-sftp-client'

jest.mock('ssh2-sftp-client')

// Shared test data and helpers
const passwordSettings: Settings = {
  auth_type: 'password',
  sftp_host: 'sftp_host',
  sftp_username: 'sftp_username',
  sftp_password: 'sftp_password',
  sftp_port: 22
}

const sshKeySettings: Settings = {
  auth_type: 'ssh_key',
  sftp_host: 'sftp_host',
  sftp_username: 'sftp_username',
  sftp_ssh_key: 'sftp_ssh_key',
  sftp_port: 22
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
        port: 22,
        username: 'sftp_username',
        password: 'sftp_password'
      })
      expect(Client.prototype.put).toHaveBeenCalled()
    })

    it('uploads file successfully with SSH key authentication', async () => {
      await uploadSFTP(sshKeySettings, 'sftp_folder_path', 'filename', Buffer.from('test content'))

      expect(Client.prototype.connect).toHaveBeenCalledWith({
        host: 'sftp_host',
        port: 22,
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

    it('re-throws non-SFTP errors unchanged', async () => {
      Client.prototype.connect = jest.fn().mockResolvedValue(undefined)
      Client.prototype.end = jest.fn().mockResolvedValue(undefined)

      // Mock a generic error (not an SFTP error)
      const genericError = new Error('Generic network error')
      Client.prototype.put = jest.fn().mockRejectedValue(genericError)

      // Should re-throw the original error
      await expect(uploadSFTP(passwordSettings, '/uploads', 'filename', Buffer.from('test content'))).rejects.toThrow(
        'Generic network error'
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

    it('should handle different key types (DSA)', () => {
      const dsaKey = `-----BEGIN DSA PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END DSA PRIVATE KEY-----` // gitleaks:allow

      const expectedKey =
        `-----BEGIN DSA PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz
-----END DSA PRIVATE KEY-----`

      expect(normalizeSSHKey(dsaKey)).toBe(expectedKey)
    })

    it('should handle different key types (EC)', () => {
      const ecKey = `-----BEGIN EC PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END EC PRIVATE KEY-----` // gitleaks:allow

      const expectedKey =
        `-----BEGIN EC PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz
-----END EC PRIVATE KEY-----`

      expect(normalizeSSHKey(ecKey)).toBe(expectedKey)
    })

    it('should handle OpenSSH key type', () => {
      const opensshKey = `-----BEGIN OPENSSH PRIVATE KEY-----MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz-----END OPENSSH PRIVATE KEY-----` // gitleaks:allow

      const expectedKey =
        `-----BEGIN OPENSSH PRIVATE KEY-----` + // gitleaks:allow
        `
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz
-----END OPENSSH PRIVATE KEY-----`

      expect(normalizeSSHKey(opensshKey)).toBe(expectedKey)
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
})
