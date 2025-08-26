import { testSFTPConnection } from '../client'
import { SFTP_DEFAULT_PORT } from '../constants'
import { Settings } from '../generated-types'
import destination from '../index'

// Mock the client module
jest.mock('../client')
const mockTestSFTPConnection = testSFTPConnection as jest.MockedFunction<typeof testSFTPConnection>

describe('SFTP Destination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('testAuthentication', () => {
    const mockPasswordSettings: Settings = {
      auth_type: 'password',
      sftp_host: 'test.example.com',
      sftp_username: 'testuser',
      sftp_password: 'testpass',
      sftp_port: SFTP_DEFAULT_PORT
    }

    const mockSSHKeySettings: Settings = {
      auth_type: 'ssh_key',
      sftp_host: 'test.example.com',
      sftp_username: 'testuser',
      sftp_ssh_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA1234567890\n-----END RSA PRIVATE KEY-----', // gitleaks:allow
      sftp_port: SFTP_DEFAULT_PORT
    }

    const mockAuthData = {
      settings: mockPasswordSettings,
      auth: { accessToken: '', refreshToken: '' }
    }

    it('should call testSFTPConnection with password settings', async () => {
      mockTestSFTPConnection.mockResolvedValue([])

      if (destination.authentication?.testAuthentication) {
        const result = await destination.authentication.testAuthentication(
          {} as any, // request object (not used)
          { ...mockAuthData, settings: mockPasswordSettings }
        )

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockPasswordSettings)
        expect(result).toEqual([])
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should call testSFTPConnection with SSH key settings', async () => {
      mockTestSFTPConnection.mockResolvedValue([{ name: 'file1.txt', type: '-' }])

      if (destination.authentication?.testAuthentication) {
        const result = await destination.authentication.testAuthentication(
          {} as any, // request object (not used)
          { ...mockAuthData, settings: mockSSHKeySettings }
        )

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockSSHKeySettings)
        expect(result).toEqual([{ name: 'file1.txt', type: '-' }])
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should propagate errors from testSFTPConnection', async () => {
      const testError = new Error('Authentication failed')
      mockTestSFTPConnection.mockRejectedValue(testError)

      if (destination.authentication?.testAuthentication) {
        await expect(
          destination.authentication.testAuthentication(
            {} as any, // request object (not used)
            { ...mockAuthData, settings: mockPasswordSettings }
          )
        ).rejects.toThrow('Authentication failed')

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockPasswordSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should handle connection timeout errors', async () => {
      const timeoutError = new Error('Did not complete SFTP operation under allotted time: 10000')
      mockTestSFTPConnection.mockRejectedValue(timeoutError)

      if (destination.authentication?.testAuthentication) {
        await expect(
          destination.authentication.testAuthentication(
            {} as any, // request object (not used)
            { ...mockAuthData, settings: mockPasswordSettings }
          )
        ).rejects.toThrow('Did not complete SFTP operation under allotted time: 10000')

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockPasswordSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should handle network connectivity errors', async () => {
      const networkError = new Error('ENOTFOUND test.example.com')
      mockTestSFTPConnection.mockRejectedValue(networkError)

      if (destination.authentication?.testAuthentication) {
        await expect(
          destination.authentication.testAuthentication(
            {} as any, // request object (not used)
            { ...mockAuthData, settings: mockPasswordSettings }
          )
        ).rejects.toThrow('ENOTFOUND test.example.com')

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockPasswordSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should handle authentication failures', async () => {
      const authError = new Error('connect: getConnection: All configured authentication methods failed')
      mockTestSFTPConnection.mockRejectedValue(authError)

      if (destination.authentication?.testAuthentication) {
        await expect(
          destination.authentication.testAuthentication(
            {} as any, // request object (not used)
            { ...mockAuthData, settings: mockSSHKeySettings }
          )
        ).rejects.toThrow('connect: getConnection: All configured authentication methods failed')

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockSSHKeySettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied')
      mockTestSFTPConnection.mockRejectedValue(permissionError)

      if (destination.authentication?.testAuthentication) {
        await expect(
          destination.authentication.testAuthentication(
            {} as any, // request object (not used)
            { ...mockAuthData, settings: mockPasswordSettings }
          )
        ).rejects.toThrow('Permission denied')

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(mockPasswordSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it('should work with custom port settings', async () => {
      const customPortSettings: Settings = {
        ...mockPasswordSettings,
        sftp_port: 11
      }
      mockTestSFTPConnection.mockResolvedValue([])

      if (destination.authentication?.testAuthentication) {
        await destination.authentication.testAuthentication(
          {} as any, // request object (not used)
          { ...mockAuthData, settings: customPortSettings }
        )

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(customPortSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })

    it(`should work with undefined port (defaults to ${SFTP_DEFAULT_PORT})`, async () => {
      const noPortSettings: Settings = {
        ...mockPasswordSettings,
        sftp_port: undefined
      }
      mockTestSFTPConnection.mockResolvedValue([])

      if (destination.authentication?.testAuthentication) {
        await destination.authentication.testAuthentication(
          {} as any, // request object (not used)
          { ...mockAuthData, settings: noPortSettings }
        )

        expect(mockTestSFTPConnection).toHaveBeenCalledWith(noPortSettings)
      } else {
        fail('testAuthentication method should be defined')
      }
    })
  })

  describe('destination configuration', () => {
    it('should have correct metadata', () => {
      expect(destination.name).toBe('SFTP')
      expect(destination.slug).toBe('actions-sftp')
      expect(destination.mode).toBe('cloud')
      expect(destination.description).toBe('Sync Segment events to SFTP')
    })

    it('should have authentication scheme defined', () => {
      expect(destination.authentication).toBeDefined()
      if (destination.authentication) {
        expect(destination.authentication.scheme).toBe('custom')
        expect(destination.authentication.fields).toBeDefined()
        expect(destination.authentication.testAuthentication).toBeDefined()
      }
    })

    it('should have required authentication fields', () => {
      expect(destination.authentication).toBeDefined()
      if (destination.authentication) {
        const fields = destination.authentication.fields
        expect(fields.auth_type).toBeDefined()
        expect(fields.sftp_host).toBeDefined()
        expect(fields.sftp_username).toBeDefined()
        expect(fields.sftp_password).toBeDefined()
        expect(fields.sftp_ssh_key).toBeDefined()
        expect(fields.sftp_port).toBeDefined()
      }
    })

    it('should have conditional field requirements', () => {
      expect(destination.authentication).toBeDefined()
      if (destination.authentication) {
        const passwordField = destination.authentication.fields.sftp_password
        const sshKeyField = destination.authentication.fields.sftp_ssh_key

        // Password field should be required when auth_type is 'password'
        expect(passwordField.required).toEqual({
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'password'
            }
          ]
        })

        // SSH key field should be required when auth_type is 'ssh_key'
        expect(sshKeyField.required).toEqual({
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'ssh_key'
            }
          ]
        })
      }
    })

    it('should have conditional field visibility', () => {
      expect(destination.authentication).toBeDefined()
      if (destination.authentication) {
        const passwordField = destination.authentication.fields.sftp_password
        const sshKeyField = destination.authentication.fields.sftp_ssh_key

        // Password field should be visible when auth_type is 'password'
        expect(passwordField.depends_on).toEqual({
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'password'
            }
          ]
        })

        // SSH key field should be visible when auth_type is 'ssh_key'
        expect(sshKeyField.depends_on).toEqual({
          conditions: [
            {
              fieldKey: 'auth_type',
              operator: 'is',
              value: 'ssh_key'
            }
          ]
        })
      }
    })

    it('should have actions defined', () => {
      expect(destination.actions).toBeDefined()
      expect(destination.actions.syncEvents).toBeDefined()
      expect(destination.actions.syncModelToSFTP).toBeDefined()
    })
  })
})
