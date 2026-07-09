/**
 * E2E fixtures exercising batch vs non-batch execution paths.
 *
 *  - mode: 'single' -> perform()      -> send([payload], ...)
 *  - mode: 'batch'  -> performBatch() -> send(payloads, ...)  (batch_size column reflects count)
 *
 * Success = the upload did not throw. Inspect the bucket to confirm the batch file contains one row
 * per event and the batch_size column matches the event count.
 */
import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import syncToS3 from '../index'

const FAILURE_HINT =
  'Ensure E2E_S3_* and AMAZON_S3_ACTIONS_* env vars are set and the IAM role can write to the bucket.'

const baseMapping = {
  ...defaultValues(syncToS3.fields),
  delimiter: ',',
  file_extension: 'csv',
  s3_aws_folder_name: 'e2e/batching/'
}

const fixtures: E2EFixture[] = [
  {
    description: 'Batching: single event via onEvent (non-batch path)',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...baseMapping,
      filename_prefix: 'nonbatch-single',
      enable_batching: false
    },
    event: createE2EEvent('track', 'E2E Single Non-Batch', {
      userId: 'e2e-s3-batch-user-001',
      properties: { email: 'e2e-s3-batch-001@segment.com' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batching: multiple events via onBatch (batch path)',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: {
      ...baseMapping,
      filename_prefix: 'batch-multi',
      enable_batching: true
    },
    events: [
      createE2EEvent('track', 'E2E Batch 1', {
        userId: 'e2e-s3-batch-user-002',
        properties: { email: 'e2e-s3-batch-002@segment.com' }
      }),
      createE2EEvent('track', 'E2E Batch 2', {
        userId: 'e2e-s3-batch-user-003',
        properties: { email: 'e2e-s3-batch-003@segment.com' }
      }),
      createE2EEvent('track', 'E2E Batch 3', {
        userId: 'e2e-s3-batch-user-004',
        properties: { email: 'e2e-s3-batch-004@segment.com' }
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batching: single-event batch (batch of one via onBatch)',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: {
      ...baseMapping,
      filename_prefix: 'batch-one',
      enable_batching: true
    },
    events: [
      createE2EEvent('track', 'E2E Batch Of One', {
        userId: 'e2e-s3-batch-user-005',
        properties: { email: 'e2e-s3-batch-005@segment.com' }
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
