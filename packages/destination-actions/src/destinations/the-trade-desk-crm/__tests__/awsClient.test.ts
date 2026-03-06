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
  v4: jest.fn(() => 'mock-uuid-1234')
}))

const MockedPutObjectCommand = PutObjectCommand as unknown as jest.Mock

describe('awsClient', () => {
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
    const mockInput = {
      TTDAuthToken: 'test-auth-token-123',
      AdvertiserId: 'advertiser-123',
      CrmDataId: 'crm-data-456',
      UsersFormatted: 'user1@example.com\nuser2@example.com\nuser3@example.com',
      RowCount: 3,
      DropOptions: {
        PiiType: 'Email',
        MergeMode: 'Replace',
        TtlInMinutes: 60,
        RetentionEnabled: true
      },
      segmentInternal: {
        audienceId: 'audience-789',
        destinationConfigId: 'dest-config-101',
        subscriptionId: 'subscription-202'
      }
    }

    it('should successfully send user data and metadata to AWS S3', async () => {
      await sendEventToAWS(mockInput)

      // Verify S3 client was obtained
      expect(getS3Client).toHaveBeenCalledWith('integrationsOutboundController')

      // Verify send was called twice (once for user data, once for metadata)
      expect(mockS3Send).toHaveBeenCalledTimes(2)

      // Verify PutObjectCommand was called twice
      expect(MockedPutObjectCommand).toHaveBeenCalledTimes(2)

      // Verify user data upload
      const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
      expect(userDataCall).toMatchObject({
        Bucket: expect.stringMatching(/integrations-outbound-event-store/),
        Key: 'actions-the-trade-desk-crm/advertiser-123/crm-data-456/mock-uuid-1234.txt',
        Body: mockInput.UsersFormatted,
        ContentType: 'text/csv',
        Metadata: {
          'row-count': '3'
        }
      })

      // Verify metadata upload
      const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
      expect(metadataCall).toMatchObject({
        Bucket: expect.stringMatching(/integrations-outbound-event-store/),
        Key: 'actions-the-trade-desk-crm/advertiser-123/crm-data-456/meta.json',
        ContentType: 'application/json'
      })

      // Verify metadata content
      const metadataBody = JSON.parse(metadataCall.Body)
      expect(metadataBody).toEqual({
        TDDAuthToken: mockInput.TTDAuthToken, // Legacy typo field
        TTDAuthToken: mockInput.TTDAuthToken,
        AdvertiserId: mockInput.AdvertiserId,
        CrmDataId: mockInput.CrmDataId,
        DropOptions: mockInput.DropOptions,
        RequeueCount: 0,
        segmentInternal: {
          audienceId: 'audience-789',
          destinationConfigId: 'dest-config-101',
          subscriptionId: 'subscription-202'
        }
      })
    })

    it('should handle missing optional segmentInternal fields with empty strings', async () => {
      const inputWithMissingFields = {
        ...mockInput,
        segmentInternal: {}
      }

      await sendEventToAWS(inputWithMissingFields)

      expect(mockS3Send).toHaveBeenCalledTimes(2)

      // Check metadata has empty strings for missing fields
      const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
      const metadataBody = JSON.parse(metadataCall.Body)
      expect(metadataBody.segmentInternal).toEqual({
        audienceId: '',
        destinationConfigId: '',
        subscriptionId: ''
      })
    })

    it('should handle partial segmentInternal fields', async () => {
      const inputWithPartialFields = {
        ...mockInput,
        segmentInternal: {
          audienceId: 'only-audience-id'
        }
      }

      await sendEventToAWS(inputWithPartialFields)

      expect(mockS3Send).toHaveBeenCalledTimes(2)

      const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
      const metadataBody = JSON.parse(metadataCall.Body)
      expect(metadataBody.segmentInternal).toEqual({
        audienceId: 'only-audience-id',
        destinationConfigId: '',
        subscriptionId: ''
      })
    })

    it('should generate unique file paths using uuid', async () => {
      await sendEventToAWS(mockInput)

      const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
      expect(userDataCall.Key).toContain('mock-uuid-1234')
    })

    it('should use correct S3 bucket name format', async () => {
      await sendEventToAWS(mockInput)

      const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
      const metadataCall = MockedPutObjectCommand.mock.calls[1][0]

      // Both should use the same bucket
      expect(userDataCall.Bucket).toMatch(/^integrations-outbound-event-store-/)
      expect(metadataCall.Bucket).toMatch(/^integrations-outbound-event-store-/)
      expect(userDataCall.Bucket).toBe(metadataCall.Bucket)
    })

    it('should handle S3 upload failures', async () => {
      const mockError = new Error('S3 upload failed')
      mockS3Send.mockRejectedValueOnce(mockError)

      await expect(sendEventToAWS(mockInput)).rejects.toThrow('S3 upload failed')
    })

    it('should include row count in user data metadata', async () => {
      const inputWithLargeRowCount = {
        ...mockInput,
        RowCount: 15000
      }

      await sendEventToAWS(inputWithLargeRowCount)

      const userDataCall = MockedPutObjectCommand.mock.calls[0][0]
      expect(userDataCall.Metadata['row-count']).toBe('15000')
    })

    it('should handle different PII types in DropOptions', async () => {
      const inputWithHashedEmail = {
        ...mockInput,
        DropOptions: {
          PiiType: 'EmailHashedUnifiedId2',
          MergeMode: 'Replace',
          RetentionEnabled: false
        }
      }

      await sendEventToAWS(inputWithHashedEmail)

      const metadataCall = MockedPutObjectCommand.mock.calls[1][0]
      const metadataBody = JSON.parse(metadataCall.Body)
      expect(metadataBody.DropOptions.PiiType).toBe('EmailHashedUnifiedId2')
      expect(metadataBody.DropOptions.RetentionEnabled).toBe(false)
    })

    it('should upload both files in parallel using Promise.all', async () => {
      const uploadPromises: Promise<any>[] = []
      mockS3Send.mockImplementation(() => {
        const promise = Promise.resolve({})
        uploadPromises.push(promise)
        return promise
      })

      await sendEventToAWS(mockInput)

      // Verify both uploads were initiated
      expect(uploadPromises.length).toBe(2)
    })
  })

  describe('S3 bucket name configuration', () => {
    it('should use correct S3 bucket name format', async () => {
      await sendEventToAWS({
        TTDAuthToken: 'test',
        AdvertiserId: 'adv',
        CrmDataId: 'crm',
        UsersFormatted: 'user@test.com',
        RowCount: 1,
        DropOptions: {
          PiiType: 'Email',
          MergeMode: 'Replace'
        },
        segmentInternal: {}
      })

      const bucketCall = MockedPutObjectCommand.mock.calls[0][0]
      // Should match the pattern: integrations-outbound-event-store-{env}-{region}
      expect(bucketCall.Bucket).toMatch(/^integrations-outbound-event-store-.+-.+$/)
    })
  })
})
