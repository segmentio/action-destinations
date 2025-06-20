import nock from 'nock'
import { createTestIntegration, PayloadValidationError, SegmentEvent } from '@segment/actions-core'
import Destination from '../index'
import fs from 'fs'
import { LIVERAMP_MIN_RECORD_COUNT } from '../properties'

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

    nock('https://integrations-outbound-event-store-test-us-west-2.s3.us-west-2.amazonaws.com')
      .put(
        /\/actions-liveramp-audiences\/destinationConfigId\/actionConfigId\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.csv$/
      )
      .reply(200)

    nock('https://integrations-outbound-event-store-test-us-west-2.s3.us-west-2.amazonaws.com')
      .put('/actions-liveramp-audiences/destinationConfigId/actionConfigId/meta.json')
      .reply(200)
  })
  describe('audienceEnteredS3', () => {
    it('should send events with valid payload size and events', async () => {
      const response = await testDestination.executeBatch('audienceEnteredS3', {
        events: mockedEvents,
        mapping: {
          s3_aws_access_key: 's3_aws_access_key',
          s3_aws_secret_key: 's3_aws_secret_key',
          s3_aws_bucket_name: 's3_aws_bucket_name',
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
    it(`should throw error if payload size is less than ${LIVERAMP_MIN_RECORD_COUNT}`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents.slice(1, 4),
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 's3_aws_bucket_name',
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

    it(`should throw error if S3 bucket path is invalid`, async () => {
      try {
        await testDestination.executeBatch('audienceEnteredS3', {
          events: mockedEvents,
          mapping: {
            s3_aws_access_key: 's3_aws_access_key',
            s3_aws_secret_key: 's3_aws_secret_key',
            s3_aws_bucket_name: 's3_aws_bucket_name',
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
})
