import { sendEventToAWS } from '../awsClient'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getS3Client } from '../../../lib/AWS/s3'

// Mock the AWS S3 SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}))

// Mock the S3 client getter
jest.mock('../../../lib/AWS/s3', () => ({
  getS3Client: jest.fn()
}))

// Mock uuid
jest.mock('@lukeed/uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}))

const MockedPutObjectCommand = PutObjectCommand as unknown as jest.Mock

describe('liveramp-audiences awsClient', () => {
  let mockS3Send: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock S3 client with send method
    mockS3Send = jest.fn().mockResolvedValue({})
    ;(getS3Client as jest.Mock).mockReturnValue({
      send: mockS3Send
    })
  })

  describe('sendEventToAWS', () => {
    const mockFileContents = Buffer.from('user1@example.com,John,Doe\nuser2@example.com,Jane,Smith')

    describe('SFTP upload type', () => {
      it('should successfully upload to S3 with SFTP metadata', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 'sftp',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2,
          gzipCompressFile: true,
          sftpInfo: {
            sftpUsername: 'testuser',
            sftpPassword: 'testpass',
            sftpFolderPath: '/uploads'
          }
        })

        expect(getS3Client).toHaveBeenCalledWith('integrationsOutboundController')
        expect(mockS3Send).toHaveBeenCalledTimes(2)
        expect(MockedPutObjectCommand).toHaveBeenCalledTimes(2)

        // Verify user data upload
        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall).toMatchObject({
          ContentType: 'text/csv',
          Body: mockFileContents,
          Metadata: {
            'row-count': '2'
          }
        })

        // Verify metadata
        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata).toMatchObject({
          audienceKey: 'audience-123',
          uploadType: 'sftp',
          filename: 'test-file.csv',
          gzipCompressFile: true,
          sftpInfo: {
            sftpHost: expect.any(String),
            sftpPort: expect.any(Number),
            sftpUsername: 'testuser',
            sftpPassword: 'testpass',
            sftpFolderPath: '/uploads'
          },
          segmentInternal: {
            audienceId: 'audience-123',
            destinationConfigId: 'dest-456',
            subscriptionId: 'sub-789'
          }
        })
      })

      it('should handle missing optional sftpInfo fields', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 'sftp',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2,
          sftpInfo: {}
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.sftpInfo).toMatchObject({
          sftpHost: expect.any(String),
          sftpPort: expect.any(Number),
          sftpUsername: '',
          sftpPassword: '',
          sftpFolderPath: ''
        })
      })

      it('should handle completely missing sftpInfo object', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 'sftp',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.sftpInfo).toMatchObject({
          sftpHost: expect.any(String),
          sftpPort: expect.any(Number),
          sftpUsername: '',
          sftpPassword: '',
          sftpFolderPath: ''
        })
      })
    })

    describe('S3 upload type', () => {
      it('should successfully upload to S3 with S3 metadata', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2,
          gzipCompressFile: false,
          s3Info: {
            s3BucketName: 'my-bucket',
            s3Region: 'us-west-2',
            s3AccessKeyId: 'exampleAccessKeyId',
            s3SecretAccessKey: 'exampleSecretAccessKey',
            s3BucketPath: '/data/uploads'
          }
        })

        expect(mockS3Send).toHaveBeenCalledTimes(2)

        // Verify metadata
        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata).toMatchObject({
          audienceKey: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          gzipCompressFile: false,
          s3Info: {
            s3BucketName: 'my-bucket',
            s3Region: 'us-west-2',
            s3AccessKeyId: 'exampleAccessKeyId',
            s3SecretAccessKey: 'exampleSecretAccessKey',
            s3BucketPath: '/data/uploads'
          },
          segmentInternal: {
            audienceId: 'audience-123',
            destinationConfigId: 'dest-456',
            subscriptionId: 'sub-789'
          }
        })
      })

      it('should handle missing optional s3Info fields', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2,
          s3Info: {}
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.s3Info).toMatchObject({
          s3BucketName: '',
          s3Region: '',
          s3AccessKeyId: '',
          s3SecretAccessKey: '',
          s3BucketPath: ''
        })
      })

      it('should handle completely missing s3Info object', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.s3Info).toMatchObject({
          s3BucketName: '',
          s3Region: '',
          s3AccessKeyId: '',
          s3SecretAccessKey: '',
          s3BucketPath: ''
        })
      })
    })

    describe('Optional segmentInternal fields', () => {
      it('should handle missing audienceComputeId', async () => {
        await sendEventToAWS({
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.audienceKey).toBe('')
        expect(metadata.segmentInternal.audienceId).toBe('')
      })

      it('should handle missing destinationInstanceID', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.segmentInternal.destinationConfigId).toBe('')
      })

      it('should handle missing subscriptionId', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.segmentInternal.subscriptionId).toBe('')
      })

      it('should handle all optional fields missing', async () => {
        await sendEventToAWS({
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.audienceKey).toBe('')
        expect(metadata.segmentInternal).toMatchObject({
          audienceId: '',
          destinationConfigId: '',
          subscriptionId: ''
        })
      })
    })

    describe('File path generation', () => {
      it('should generate correct file path with all IDs present', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Key).toContain('dest-456/sub-789/audience-123/test-uuid-12345.csv')
      })

      it('should generate correct file path with missing audienceComputeId', async () => {
        await sendEventToAWS({
          destinationInstanceID: 'dest-456',
          subscriptionId: 'sub-789',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Key).toContain('dest-456/sub-789/test-uuid-12345.csv')
        expect(userDataCall.Key).not.toContain('audience-')
      })

      it('should generate correct file path with missing subscriptionId', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          destinationInstanceID: 'dest-456',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Key).toContain('dest-456/audience-123/test-uuid-12345.csv')
      })

      it('should generate correct file path with only audienceComputeId', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Key).toContain('audience-123/test-uuid-12345.csv')
      })

      it('should handle empty aggregated file path', async () => {
        await sendEventToAWS({
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        // When all IDs are missing, path should still work
        expect(userDataCall.Key).toContain('test-uuid-12345.csv')
      })
    })

    describe('Row count metadata', () => {
      it('should include correct row count in metadata', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 999
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Metadata['row-count']).toBe('999')
      })

      it('should handle zero row count', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: Buffer.from(''),
          rowCount: 0
        })

        const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
        expect(userDataCall.Metadata['row-count']).toBe('0')
      })
    })

    describe('gzipCompressFile flag', () => {
      it('should include gzipCompressFile: true in metadata', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv.gz',
          fileContents: mockFileContents,
          rowCount: 2,
          gzipCompressFile: true
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.gzipCompressFile).toBe(true)
      })

      it('should include gzipCompressFile: false in metadata', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2,
          gzipCompressFile: false
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.gzipCompressFile).toBe(false)
      })

      it('should handle undefined gzipCompressFile', async () => {
        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
        const metadata = JSON.parse(metadataCall.Body)
        expect(metadata.gzipCompressFile).toBeUndefined()
      })
    })

    describe('Error handling', () => {
      it('should propagate S3 upload errors', async () => {
        const mockError = new Error('S3 upload failed')
        mockS3Send.mockRejectedValueOnce(mockError)

        await expect(
          sendEventToAWS({
            audienceComputeId: 'audience-123',
            uploadType: 's3',
            filename: 'test-file.csv',
            fileContents: mockFileContents,
            rowCount: 2
          })
        ).rejects.toThrow('S3 upload failed')
      })
    })

    describe('Parallel uploads', () => {
      it('should upload user data and metadata in parallel', async () => {
        const uploadPromises: Promise<any>[] = []
        mockS3Send.mockImplementation(() => {
          const promise = Promise.resolve({})
          uploadPromises.push(promise)
          return promise
        })

        await sendEventToAWS({
          audienceComputeId: 'audience-123',
          uploadType: 's3',
          filename: 'test-file.csv',
          fileContents: mockFileContents,
          rowCount: 2
        })

        // Both uploads should be initiated
        expect(uploadPromises.length).toBe(2)
      })
    })
  })

  describe('S3 bucket name configuration', () => {
    it('should use correct S3 bucket name format', async () => {
      await sendEventToAWS({
        audienceComputeId: 'test',
        uploadType: 's3',
        filename: 'test.csv',
        fileContents: Buffer.from('test'),
        rowCount: 1
      })

      const bucketCall = MockedPutObjectCommand.mock.calls[0][0]
      // Should match the pattern: integrations-outbound-event-store-{env}-{region}
      expect(bucketCall.Bucket).toMatch(/^integrations-outbound-event-store-.+-.+$/)
    })
  })
})
