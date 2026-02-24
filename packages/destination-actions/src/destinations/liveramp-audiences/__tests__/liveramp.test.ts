import nock from 'nock'
import { createTestIntegration, PayloadValidationError, SegmentEvent, StatsContext } from '@segment/actions-core'
import Destination from '../index'
import fs from 'fs'
import {
  LIVERAMP_ALPHABETICAL_FIELD_ORDER_FLAG_NAME,
  LIVERAMP_ENABLE_COMPRESSION_FLAG_NAME,
  LIVERAMP_MIN_RECORD_COUNT
} from '../properties'

const testDestination = createTestIntegration(Destination)

const mockedEvents: SegmentEvent[] = Array.from({ length: 50 }, (_, i) => ({
  messageId: `segment-test-message-00000${i + 2}`,
  timestamp: '2023-07-26T15:23:39.803Z',
  type: 'track',
  userId: `userid${i + 2}`,
  receivedAt: '2015-12-12T19:11:01.266Z',
  properties: {},
  event: 'Audience Entered'
}))

let s3MetadataPayload: unknown = null
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation((command) => {
      if (command.input?.Key?.includes('meta.json')) {
        s3MetadataPayload = JSON.parse(command.input.Body)
      }
      return Promise.resolve({
        $metadata: { httpStatusCode: 200 }
      })
    })
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({
    constructor: { name: 'PutObjectCommand' },
    input
  }))
}))

describe('Liveramp Audiences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    s3MetadataPayload = null
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

    it('should track incoming header order metric when statsContext is provided', async () => {
      const mockStatsClient = {
        histogram: jest.fn(),
        incr: jest.fn(),
        observe: jest.fn(),
        _name: '',
        _tags: [],
        set: jest.fn()
      }
      const statsContext: StatsContext = { statsClient: mockStatsClient as any, tags: ['test-tag'] }
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
          identifier_data: {
            email: { '@path': '$.properties.email' },
            first_name: { '@path': '$.properties.first_name' }
          }
        },
        subscriptionMetadata: {
          destinationConfigId: 'test-destination-config-id',
          actionConfigId: 'test-action-config-id',
          sourceId: 'test-source-id',
          actionId: 'test-action-id'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        statsContext
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'liveramp_audiences.incoming_header_order',
        1,
        expect.arrayContaining([
          'test-tag',
          'actionConfigId:test-action-config-id',
          'destinationConfigId:test-destination-config-id',
          'sourceId:test-source-id',
          'actionId:test-action-id'
        ])
      )
    })

    it('should track alphabetical order when flag is enabled', async () => {
      const mockStatsClient = {
        histogram: jest.fn(),
        incr: jest.fn(),
        observe: jest.fn(),
        _name: '',
        _tags: [],
        set: jest.fn()
      }
      const statsContext: StatsContext = { statsClient: mockStatsClient as any, tags: ['test-tag'] }

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
          enable_batching: true
        },
        subscriptionMetadata: {
          destinationConfigId: 'test-destination-config-id',
          actionConfigId: 'test-action-config-id',
          sourceId: 'test-source-id',
          actionId: 'test-action-id'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {
          [LIVERAMP_ALPHABETICAL_FIELD_ORDER_FLAG_NAME]: true
        },
        statsContext
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'liveramp_audiences.incoming_header_order',
        1,
        expect.arrayContaining([
          'test-tag',
          'actionConfigId:test-action-config-id',
          'destinationConfigId:test-destination-config-id',
          'sourceId:test-source-id',
          'actionId:test-action-id'
        ])
      )
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

    it('should track incoming header order metric when statsContext is provided', async () => {
      const mockStatsClient = {
        histogram: jest.fn(),
        incr: jest.fn(),
        observe: jest.fn(),
        _name: '',
        _tags: [],
        set: jest.fn()
      }
      const statsContext: StatsContext = { statsClient: mockStatsClient as any, tags: ['test-tag'] }

      await testDestination.executeBatch('audienceEnteredSFTP', {
        events: mockedEvents,
        mapping: {
          sftp_username: 'sftp_username',
          sftp_aws_access_key: 'sftp_aws_access_key',
          sftp_folder_path: 'sftp_folder_path',
          sftp_password: 'sftp_password',
          audience_key: 'audience_key',
          delimiter: ',',
          filename: 'filename.csv',
          enable_batching: true,
          identifier_data: {
            email: { '@path': '$.properties.email' },
            first_name: { '@path': '$.properties.first_name' }
          }
        },
        subscriptionMetadata: {
          destinationConfigId: 'test-destination-config-id',
          actionConfigId: 'test-action-config-id',
          sourceId: 'test-source-id',
          actionId: 'test-action-id'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        statsContext
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'liveramp_audiences.incoming_header_order',
        1,
        expect.arrayContaining([
          'test-tag',
          'actionConfigId:test-action-config-id',
          'destinationConfigId:test-destination-config-id',
          'sourceId:test-source-id',
          'actionId:test-action-id'
        ])
      )
    })

    it('should track alphabetical order when flag is enabled', async () => {
      const mockStatsClient = {
        histogram: jest.fn(),
        incr: jest.fn(),
        observe: jest.fn(),
        _name: '',
        _tags: [],
        set: jest.fn()
      }
      const statsContext: StatsContext = { statsClient: mockStatsClient as any, tags: ['test-tag'] }

      await testDestination.executeBatch('audienceEnteredSFTP', {
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
          destinationConfigId: 'test-destination-config-id',
          actionConfigId: 'test-action-config-id',
          sourceId: 'test-source-id',
          actionId: 'test-action-id'
        },
        settings: {
          __segment_internal_engage_force_full_sync: true,
          __segment_internal_engage_batch_sync: true
        },
        features: {
          [LIVERAMP_ALPHABETICAL_FIELD_ORDER_FLAG_NAME]: true
        },
        statsContext
      })

      expect(mockStatsClient.incr).toHaveBeenCalledWith(
        'liveramp_audiences.incoming_header_order',
        1,
        expect.arrayContaining([
          'test-tag',
          'actionConfigId:test-action-config-id',
          'destinationConfigId:test-destination-config-id',
          'sourceId:test-source-id',
          'actionId:test-action-id'
        ])
      )
    })
  })
})
