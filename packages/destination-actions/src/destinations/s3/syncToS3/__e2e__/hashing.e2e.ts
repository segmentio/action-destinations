/**
 * E2E fixtures for the SHA256 column hashing / normalization capability.
 *
 * Hashing and normalization are gated behind the `actions-s3-hashing` feature flag
 * (S3_HASHING_FEATURE_FLAG):
 *  - flag ON  + columns_to_transform configured -> file is written with those columns transformed (success)
 *  - flag ON  + no columns_to_transform          -> file written as-is (success)
 *  - flag OFF + columns_to_transform configured  -> PayloadValidationError thrown, nothing uploaded (error)
 *
 * Each entry in columns_to_transform selects a hash_algorithm ('none' or 'sha256') and a normalize
 * mode ('none' | 'lowercase' | 'trim' | 'lowercase_trim'). hash_algorithm 'none' normalizes without
 * hashing.
 *
 * NOTE: These fixtures require an e2e runner that forwards `fixture.features` into onEvent/onBatch
 * (the runner branch with per-fixture feature-flag support). The success cases only assert the
 * upload did not throw — inspect the bucket to confirm the columns are actually transformed.
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
      filename_prefix: 'hash-single',
      columns_to_transform: [
        { column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' },
        { column_name: 'user_id', hash_algorithm: 'sha256', normalize: 'none' }
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
    description: 'Hashing (flag ON): email normalized (lowercase_trim) before SHA256',
    subscribe: 'type = "track"',
    mode: 'single',
    features: FLAG_ON,
    mapping: {
      ...baseMapping,
      filename_prefix: 'hash-normalize',
      columns_to_transform: [{ column_name: 'email', hash_algorithm: 'sha256', normalize: 'lowercase_trim' }]
    },
    event: createE2EEvent('track', 'E2E Hashing Normalized', {
      userId: 'e2e-s3-hash-user-002',
      properties: { email: '  E2E-S3-Hash-002@Segment.com  ' },
      traits: { email: '  E2E-S3-Hash-002@Segment.com  ' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Normalize only (flag ON): email lowercased and trimmed, not hashed',
    subscribe: 'type = "track"',
    mode: 'single',
    features: FLAG_ON,
    mapping: {
      ...baseMapping,
      filename_prefix: 'normalize-only',
      columns_to_transform: [{ column_name: 'email', hash_algorithm: 'none', normalize: 'lowercase_trim' }]
    },
    event: createE2EEvent('track', 'E2E Normalize Only', {
      userId: 'e2e-s3-hash-user-003',
      properties: { email: '  E2E-S3-Hash-003@Segment.com  ' },
      traits: { email: '  E2E-S3-Hash-003@Segment.com  ' }
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
      filename_prefix: 'hash-batch',
      columns_to_transform: [{ column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' }]
    },
    events: [
      createE2EEvent('track', 'E2E Hashing Batch A', {
        userId: 'e2e-s3-hash-user-004',
        properties: { email: 'e2e-s3-hash-004@segment.com' },
        traits: { email: 'e2e-s3-hash-004@segment.com' }
      }),
      createE2EEvent('track', 'E2E Hashing Batch B', {
        userId: 'e2e-s3-hash-user-005',
        properties: { email: 'e2e-s3-hash-005@segment.com' },
        traits: { email: 'e2e-s3-hash-005@segment.com' }
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Hashing (flag ON): no columns_to_transform configured — file written unchanged',
    subscribe: 'type = "track"',
    mode: 'single',
    features: FLAG_ON,
    mapping: {
      ...baseMapping,
      filename_prefix: 'hash-none'
    },
    event: createE2EEvent('track', 'E2E No Hashing', {
      userId: 'e2e-s3-hash-user-006',
      properties: { email: 'e2e-s3-hash-006@segment.com' },
      traits: { email: 'e2e-s3-hash-006@segment.com' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Hashing (flag OFF): columns_to_transform configured — throws PayloadValidationError, no upload',
    subscribe: 'type = "track"',
    mode: 'single',
    // no `features` — flag is off
    mapping: {
      ...baseMapping,
      columns_to_transform: [{ column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' }]
    },
    event: createE2EEvent('track', 'E2E Hashing Flag Off', {
      userId: 'e2e-s3-hash-user-007',
      properties: { email: 'e2e-s3-hash-007@segment.com' },
      traits: { email: 'e2e-s3-hash-007@segment.com' }
    }),
    expect: { status: 'error', errorType: 'PayloadValidationError' },
    verboseFailureHint:
      'Expected a PayloadValidationError because a transform is configured while the actions-s3-hashing flag is off. If this uploaded instead, the flag guard in send() is not firing.'
  }
]

export default fixtures
