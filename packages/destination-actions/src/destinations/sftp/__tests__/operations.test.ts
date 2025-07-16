import { enquoteIdentifier, generateFile } from '../operations'
import type { Payload } from '../syncToSFTP/generated-types'

describe('Test operations', () => {
  describe('enquoteIdentifier', () => {
    it('should properly quote identifiers with no special characters', () => {
      expect(enquoteIdentifier('simple')).toBe('"simple"')
      expect(enquoteIdentifier('123')).toBe('"123"')
    })

    it('should escape quotes within identifiers', () => {
      expect(enquoteIdentifier('LCD TV,50"')).toBe('"LCD TV,50"""')
      expect(enquoteIdentifier('Say "Hello"')).toBe('"Say ""Hello"""')
    })

    it('should handle empty strings', () => {
      expect(enquoteIdentifier('')).toBe('""')
    })

    it('should handle strings with delimiters', () => {
      expect(enquoteIdentifier('Hello, World')).toBe('"Hello, World"')
      expect(enquoteIdentifier('A;B;C')).toBe('"A;B;C"')
    })
  })

  describe('generateFile', () => {
    it('should generate CSV file with headers', () => {
      const payloads: Payload[] = [
        {
          sftp_host: 'test.example.com',
          sftp_username: 'testuser',
          sftp_password: 'testpass',
          sftp_folder_path: '/uploads',
          audience_key: 'user123',
          identifier_data: {
            email: 'test@example.com',
            name: 'John Doe'
          },
          delimiter: ',',
          filename: 'test.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads)

      expect(result.filename).toBe('test.csv')
      expect(result.fileContents).toBeInstanceOf(Buffer)

      const content = result.fileContents.toString()
      expect(content).toContain('audience_key')
      expect(content).toContain('email')
      expect(content).toContain('name')
      expect(content).toContain('"user123"')
      expect(content).toContain('"test@example.com"')
      expect(content).toContain('"John Doe"')
    })

    it('should handle multiple payloads', () => {
      const payloads: Payload[] = [
        {
          sftp_host: 'test.example.com',
          sftp_username: 'testuser',
          sftp_password: 'testpass',
          sftp_folder_path: '/uploads',
          audience_key: 'user123',
          identifier_data: {
            email: 'test1@example.com'
          },
          delimiter: ',',
          filename: 'test.csv',
          enable_batching: true
        },
        {
          sftp_host: 'test.example.com',
          sftp_username: 'testuser',
          sftp_password: 'testpass',
          sftp_folder_path: '/uploads',
          audience_key: 'user456',
          identifier_data: {
            email: 'test2@example.com',
            name: 'Jane Smith'
          },
          delimiter: ',',
          filename: 'test.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads)
      const content = result.fileContents.toString()

      // Should contain both users
      expect(content).toContain('"user123"')
      expect(content).toContain('"user456"')
      expect(content).toContain('"test1@example.com"')
      expect(content).toContain('"test2@example.com"')
      expect(content).toContain('"Jane Smith"')
    })

    it('should handle different delimiters', () => {
      const payloads: Payload[] = [
        {
          sftp_host: 'test.example.com',
          sftp_username: 'testuser',
          sftp_password: 'testpass',
          sftp_folder_path: '/uploads',
          audience_key: 'user123',
          identifier_data: {
            email: 'test@example.com'
          },
          delimiter: '|',
          filename: 'test.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads)
      const content = result.fileContents.toString()

      expect(content).toContain('audience_key|email')
      expect(content).toContain('"user123"|"test@example.com"')
    })

    it('should handle payloads without identifier_data', () => {
      const payloads: Payload[] = [
        {
          sftp_host: 'test.example.com',
          sftp_username: 'testuser',
          sftp_password: 'testpass',
          sftp_folder_path: '/uploads',
          audience_key: 'user123',
          delimiter: ',',
          filename: 'test.csv',
          enable_batching: true
        }
      ]

      const result = generateFile(payloads)
      const content = result.fileContents.toString()

      expect(content).toBe('audience_key\n"user123"')
    })
  })
})
