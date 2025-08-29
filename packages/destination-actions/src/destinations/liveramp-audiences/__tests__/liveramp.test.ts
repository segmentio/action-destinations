import nock from 'nock'
import { createTestIntegration, PayloadValidationError, SegmentEvent } from '@segment/actions-core'
import Destination from '../index'
import fs from 'fs'
import { LIVERAMP_MIN_RECORD_COUNT, LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME } from '../properties'

const testDestination = createTestIntegration(Destination)

const mockAwsCredentials = {
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  sessionToken: 'sessionToken'
}

const mockedEvents: SegmentEvent[] = Array.from({ length: 50 }, (_, i) => ({
  messageId: `segment-test-message-00000${i + 2}`,
  timestamp: '2023-07-26T15:23:39.803Z',
  type: 'track',
  userId: `userid${i + 2}`,
  receivedAt: '2015-12-12T19:11:01.266Z',
  properties: {},
  event: 'Audience Entered'
}))

describe('Liveramp Audiences', () => {
  let s3MetadataPayload: unknown = null
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    jest.spyOn(fs, 'readFileSync').mockReturnValue('token')

    nock('https://kubernetes.default.svc')
      .get('/api/v1/namespaces/default/serviceaccounts/pod-service-account')
      .reply(200, {
        metadata: {
          annotations: {
            'eks.amazonaws.com/role-arn': 'arn:aws:iam::123456789012:role/role-name'
          }
        }
      })

    nock('https://sts.us-west-2.amazonaws.com/')
      .get(
        `/?` +
          `Action=AssumeRoleWithWebIdentity` +
          `&DurationSeconds=3600` +
          `&RoleSessionName=integrations-monoservice` +
          `&RoleArn=arn:aws:iam::123456789012:role/role-name` +
          `&WebIdentityToken=token` +
          `&Version=2011-06-15`
      )
      .reply(200, {
        AssumeRoleWithWebIdentityResponse: {
          AssumeRoleWithWebIdentityResult: {
            Credentials: {
              accessKeyId: mockAwsCredentials.accessKeyId,
              secretAccessKey: mockAwsCredentials.secretAccessKey,
              sessionToken: mockAwsCredentials.sessionToken
            }
          }
        }
      })

    // capture request body in
    nock('https://integrations-outbound-event-store-test-us-west-2.s3.us-west-2.amazonaws.com')
      .put(
        /\/actions-liveramp-audiences\/destinationConfigId\/actionConfigId\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.csv$/
      )
      .reply(200)

    nock('https://integrations-outbound-event-store-test-us-west-2.s3.us-west-2.amazonaws.com')
      .put('/actions-liveramp-audiences/destinationConfigId/actionConfigId/meta.json', (reqbody: any) => {
        s3MetadataPayload = reqbody
        return true
      })
      .reply(200)

    // Mock S3 HeadBucket requests for permission validation (all bucket names)
    nock(/https:\/\/.*\.s3\.amazonaws\.com/)
      .persist()
      .head('/')
      .reply(200)
  })
  describe('audienceEnteredS3', () => {
    it('should send events with valid payload size and events', async () => {
      const response = await testDestination.executeBatch('audienceEnteredS3', {
        events: mockedEvents,
        mapping: {
          s3_aws_access_key: 's3_aws_access_key',
          s3_aws_secret_key: 's3_aws_secret_key',
          s3_aws_bucket_name: 's3-aws-bucket-name',
          s3_aws_region: 's3_aws_region',
          audience_key: 'audience_key',
          delimiter: ',',
          filename: 'filename.csv',
          enable_batching: true,
          s3_aws_bucket_path: 'folder1/folder2'
        },
        subscriptionMetadata: {
          destinationConfigId: 'destinationConfigId',
          actionConfigId: 'actionConfigId'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        }
      })
      for (let i = 0; i < mockedEvents.length; i++) {
        expect(response.at(i)?.status).toEqual(200)
      }
    })

    it('should set gzipCompressFile flag as true if feature flag is enabled', async () => {
      const response = await testDestination.executeBatch('audienceEnteredS3', {
        events: mockedEvents,
        mapping: {
          s3_aws_access_key: 's3_aws_access_key',
          s3_aws_secret_key: 's3_aws_secret_key',
          s3_aws_bucket_name: 's3-aws-bucket-name',
          s3_aws_region: 's3_aws_region',
          audience_key: 'audience_key',
          delimiter: ',',
          filename: 'filename.csv',
          enable_batching: true
        },
        subscriptionMetadata: {
          destinationConfigId: 'destinationConfigId',
          actionConfigId: 'actionConfigId'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {
          [LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME]: true
        }
      })
      for (let i = 0; i < mockedEvents.length; i++) {
        expect(response.at(i)?.status).toEqual(200)
      }
      expect(s3MetadataPayload).toBeDefined()
      expect(s3MetadataPayload).toMatchObject({
        gzipCompressFile: true
      })
    })

    it(`should throw error if payload size is less than ${LIVERAMP_MIN_RECORD_COUNT}`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents.slice(1, 4),
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 's3-aws-bucket-name',
            s3_aws_region: 's3_aws_region',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
      } catch (e) {
        expect(e).toBeInstanceOf(PayloadValidationError)
        expect(e.message).toEqual(
          `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: 3`
        )
        expect(e.status).toEqual(400)
      }
    })

    it(`should throw error if S3 bucket name is invalid`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 'for-liveramp/folder01/folder_001/',
            s3_aws_region: 's3_aws_region',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
      } catch (e) {
        expect(e).toBeInstanceOf(PayloadValidationError)
        expect(e.message).toEqual(
          `Invalid S3 bucket name: "for-liveramp/folder01/folder_001/". Bucket names cannot contain '/' characters, must be lowercase, and follow AWS naming conventions.`
        )
        expect(e.status).toEqual(400)
      }
    })

    it(`should throw error if S3 bucket path is invalid`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 's3-aws-bucket-name',
            s3_aws_region: 's3_aws_region',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true,
            s3_aws_bucket_path: '/invalid[]/path/'
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
      } catch (e) {
        expect(e).toBeInstanceOf(PayloadValidationError)
        expect(e.message).toEqual(
          `Invalid S3 bucket path. It must be a valid S3 object key, avoid leading/trailing slashes and forbidden characters (e.g., \\ { } ^ [ ] % \` " < > # | ~). Use a relative path like "folder1/folder2".`
        )
        expect(e.status).toEqual(400)
      }
    })
  })
  describe('audienceEnteredSFTP', () => {
    it('should send events with valid payload size and events', async () => {
      const response = await testDestination.executeBatch('audienceEnteredSFTP', {
        events: mockedEvents,
        mapping: {
          sftp_username: 'sftp_username',
          sftp_aws_access_key: 'sftp_aws_access_key',
          sftp_folder_path: 'sftp_folder_path',
          sftp_password: 'sftp_password',
          audience_key: 'audience_key',
          delimiter: ',',
          filename: 'filename.csv',
          enable_batching: true
        },
        subscriptionMetadata: {
          destinationConfigId: 'destinationConfigId',
          actionConfigId: 'actionConfigId'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {}
      })
      for (let i = 0; i < mockedEvents.length; i++) {
        expect(response.at(i)?.status).toEqual(200)
      }
    })

    it('should set gzipCompressFile flag as true if feature flag is enabled', async () => {
      const response = await testDestination.executeBatch('audienceEnteredSFTP', {
        events: mockedEvents,
        mapping: {
          sftp_username: 'sftp_username',
          sftp_aws_access_key: 'sftp_aws_access_key',
          sftp_folder_path: 'sftp_folder_path',
          sftp_password: 'sftp_password',
          audience_key: 'audience_key',
          delimiter: ',',
          filename: 'filename.csv',
          enable_batching: true
        },
        subscriptionMetadata: {
          destinationConfigId: 'destinationConfigId',
          actionConfigId: 'actionConfigId'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {
          [LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME]: true
        }
      })
      for (let i = 0; i < mockedEvents.length; i++) {
        expect(response.at(i)?.status).toEqual(200)
      }
      expect(s3MetadataPayload).toMatchObject({
        gzipCompressFile: true
      })
    })
    it(`should throw error if payload size is less than ${LIVERAMP_MIN_RECORD_COUNT}`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredSFTP', {
          events: mockedEvents.slice(1, 4),
          mapping: {
            sftp_username: 'sftp_username',
            sftp_aws_access_key: 'sftp_aws_access_key',
            sftp_folder_path: 'sftp_folder_path',
            sftp_password: 'sftp_password',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
      } catch (e) {
        expect(e).toBeInstanceOf(PayloadValidationError)
        expect(e.message).toEqual(
          `received payload count below LiveRamp's ingestion limits. expected: >=${LIVERAMP_MIN_RECORD_COUNT} actual: 3`
        )
        expect(e.status).toEqual(400)
      }
    })
  })

  describe('S3 Permissions Validation', () => {
    it('should throw PayloadValidationError if required S3 credentials are missing', async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_region: 'us-west-2',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (e) {
        expect(e.message).toEqual('Missing required S3 credentials.')
      }
    })

    it('should throw InvalidAuthenticationError if IAM credentials are invalid (403)', async () => {
      // Clear persistent mocks and set up specific 403 mock
      nock.cleanAll()
      nock('https://test-bucket.s3.amazonaws.com').head('/').reply(403)

      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_access_key: 'invalid-access-key',
            s3_aws_secret_key: 'invalid-secret-key',
            s3_aws_bucket_name: 'test-bucket',
            s3_aws_region: 'us-west-2',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (e) {
        expect(e.message).toEqual(
          'AWS IAM credentials are invalid or do not have permission to access S3 bucket "test-bucket". Please verify your access key, secret key, and bucket permissions.'
        )
      }
    })

    it('should throw InvalidAuthenticationError if S3 bucket does not exist (404)', async () => {
      // Clear persistent mocks and set up specific 404 mock
      nock.cleanAll()
      nock('https://nonexistent-bucket.s3.amazonaws.com').head('/').reply(404)

      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 'nonexistent-bucket',
            s3_aws_region: 'us-west-2',
            audience_key: 'audience_key',
            delimiter: ',',
            filename: 'filename.csv',
            enable_batching: true
          },
          subscriptionMetadata: {
            destinationConfigId: 'destinationConfigId',
            actionConfigId: 'actionConfigId'
          },
          settings: {
            __segment_internal_engage_force_full_sync: true,
            __segment_internal_engage_batch_sync: true
          }
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (e) {
        expect(e.message).toContain(
          'S3 bucket "nonexistent-bucket" does not exist or is not accessible with the provided credentials.'
        )
      }
    })
  })
})
