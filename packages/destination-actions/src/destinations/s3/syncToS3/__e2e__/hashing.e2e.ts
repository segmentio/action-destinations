/**
 * E2E fixtures for the SHA256 column-hashing capability.
 *
 * Hashing is gated behind the `actions-s3-hashing` feature flag (S3_HASHING_FEATURE_FLAG):
 *  - flag ON  + columns_to_hash configured -> file is written with those columns hashed (success)
 *  - flag ON  + no columns_to_hash          -> file written as-is (success)
 *  - flag OFF + columns_to_hash configured  -> PayloadValidationError thrown, nothing uploaded (error)
 *
 * NOTE: These fixtures require an e2e runner that forwards `fixture.features` into onEvent/onBatch
 * (the runner branch with per-fixture feature-flag support). The success cases only assert the
 * upload did not throw — inspect the bucket to confirm the hashed columns are actually hashed.
 */
import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import syncToS3 from '../index'
import { S3_HASHING_FEATURE_FLAG } from '../../constants'

const FLAG_ON = { [S3_HASHING_FEATURE_FLAG]: true }

const FAILURE_HINT =
  'Ensure E2E_S3_* and AMAZON_S3_ACTIONS_* env vars are set and the IAM role can write to the bucket. Flag-gated cases also require an e2e runner that forwards fixture.features.'

const baseMapping = {
  ...defaultValues(syncToS3.fields),
  delimiter: ',',
  file_extension: 'csv',
  s3_aws_folder_name: 'e2e/hashing/'
}

const fixtures: E2EFixture[] = [
  {
    description: 'Hashing (flag ON): single event with email + user_id hashed via SHA256',
    subscribe: 'type = "track"',
    mode: 'single',
    features: FLAG_ON,
    mapping: {
      ...baseMapping,
      columns_to_hash: [
        { column_name: 'email', hash_algorithm: 'sha256' },
        { column_name: 'user_id', hash_algorithm: 'sha256' }
      ]
    },
    event: createE2EEvent('track', 'E2E Hashing Single', {
      userId: 'e2e-s3-hash-user-001',
      properties: { email: 'e2e-s3-hash-001@segment.com' },
      traits: { email: 'e2e-s3-hash-001@segment.com' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Hashing (flag ON): batch of events with email hashed via SHA256',
    subscribe: 'type = "track"',
    mode: 'batch',
    features: FLAG_ON,
    mapping: {
      ...baseMapping,
      columns_to_hash: [{ column_name: 'email', hash_algorithm: 'sha256' }]
    },
    events: [
      createE2EEvent('track', 'E2E Hashing Batch A', {
        userId: 'e2e-s3-hash-user-002',
        properties: { email: 'e2e-s3-hash-002@segment.com' },
        traits: { email: 'e2e-s3-hash-002@segment.com' }
      }),
      createE2EEvent('track', 'E2E Hashing Batch B', {
        userId: 'e2e-s3-hash-user-003',
        properties: { email: 'e2e-s3-hash-003@segment.com' },
        traits: { email: 'e2e-s3-hash-003@segment.com' }
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Hashing (flag ON): no columns_to_hash configured — file written unhashed',
    subscribe: 'type = "track"',
    mode: 'single',
    features: FLAG_ON,
    mapping: {
      ...baseMapping
    },
    event: createE2EEvent('track', 'E2E No Hashing', {
      userId: 'e2e-s3-hash-user-004',
      properties: { email: 'e2e-s3-hash-004@segment.com' },
      traits: { email: 'e2e-s3-hash-004@segment.com' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Hashing (flag OFF): columns_to_hash configured — throws PayloadValidationError, no upload',
    subscribe: 'type = "track"',
    mode: 'single',
    // no `features` — flag is off
    mapping: {
      ...baseMapping,
      columns_to_hash: [{ column_name: 'email', hash_algorithm: 'sha256' }]
    },
    event: createE2EEvent('track', 'E2E Hashing Flag Off', {
      userId: 'e2e-s3-hash-user-005',
      properties: { email: 'e2e-s3-hash-005@segment.com' },
      traits: { email: 'e2e-s3-hash-005@segment.com' }
    }),
    expect: { status: 'error', errorType: 'PayloadValidationError' },
    verboseFailureHint:
      'Expected a PayloadValidationError because hashing is configured while the actions-s3-hashing flag is off. If this uploaded instead, the flag guard in send() is not firing.'
  }
]

export default fixtures
