/**
 * E2E fixtures exercising many combinations of columns, delimiters, and file extensions.
 *
 * `columns` is an object mapping output-column name -> value (mapping-kit directives). These
 * fixtures override `columns` explicitly (rather than relying on defaultValues) to control exactly
 * which columns land in the file. Success = the upload did not throw; inspect the bucket to confirm
 * headers, delimiters, and object serialization.
 */
import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEvent } from '@segment/actions-core'
import syncToS3 from '../index'

const FAILURE_HINT =
  'Ensure E2E_S3_* and AMAZON_S3_ACTIONS_* env vars are set and the IAM role can write to the bucket.'

const baseMapping = {
  ...defaultValues(syncToS3.fields),
  file_extension: 'csv',
  s3_aws_folder_name: 'e2e/fields/'
}

const richEvent = () =>
  createE2EEvent('track', 'E2E Fields Rich', {
    userId: 'e2e-s3-fields-user-001',
    anonymousId: 'e2e-s3-fields-anon-001',
    properties: {
      email: 'e2e-s3-fields-001@segment.com',
      order_id: '$guid:order',
      total: 42.5,
      items: ['sku-1', 'sku-2'],
      nested: { a: 1, b: { c: 2 } }
    },
    traits: { first_name: 'Ada', last_name: 'Lovelace', email: 'e2e-s3-fields-001@segment.com' },
    integrations: { All: false, 'AWS S3 (Actions)': true }
  })

const fixtures: E2EFixture[] = [
  {
    description: 'Fields: minimal columns (user_id + email only)',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...baseMapping,
      delimiter: ',',
      columns: {
        user_id: { '@path': '$.userId' },
        email: { '@path': '$.properties.email' }
      }
    },
    event: createE2EEvent('track', 'E2E Fields Minimal', {
      userId: 'e2e-s3-fields-user-002',
      properties: { email: 'e2e-s3-fields-002@segment.com' }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Fields: all standard columns plus object columns (properties/traits/context)',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...baseMapping,
      delimiter: ','
    },
    event: richEvent(),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Fields: custom (additional) columns beyond the standard set',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...baseMapping,
      delimiter: ',',
      columns: {
        user_id: { '@path': '$.userId' },
        email: { '@path': '$.properties.email' },
        order_id: { '@path': '$.properties.order_id' },
        total: { '@path': '$.properties.total' },
        loyalty_tier: { '@path': '$.properties.loyalty_tier' }
      }
    },
    event: createE2EEvent('track', 'E2E Fields Custom', {
      userId: 'e2e-s3-fields-user-003',
      properties: {
        email: 'e2e-s3-fields-003@segment.com',
        order_id: '$guid:order3',
        total: 19.99,
        loyalty_tier: 'gold'
      }
    }),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Fields: tab delimiter with txt file extension',
    subscribe: 'type = "track"',
    mode: 'single',
    mapping: {
      ...baseMapping,
      delimiter: 'tab',
      file_extension: 'txt'
    },
    event: richEvent(),
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Fields: pipe delimiter, batch of events',
    subscribe: 'type = "track"',
    mode: 'batch',
    mapping: {
      ...baseMapping,
      delimiter: '|'
    },
    events: [
      createE2EEvent('track', 'E2E Fields Pipe A', {
        userId: 'e2e-s3-fields-user-004',
        properties: { email: 'e2e-s3-fields-004@segment.com' }
      }),
      createE2EEvent('track', 'E2E Fields Pipe B', {
        userId: 'e2e-s3-fields-user-005',
        properties: { email: 'e2e-s3-fields-005@segment.com' }
      })
    ],
    expect: { status: 'success' },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
