/**
 * E2E fixtures exercising combinations of columns and value shapes.
 *
 * `columns` is an object mapping output-column name -> value (mapping-kit directives). These
 * fixtures override `columns` explicitly (rather than relying on defaultValues) to control exactly
 * which columns land in the file. Delimiter and file-extension coverage lives in formats.e2e.ts;
 * this file focuses on which columns are written and how object values serialize. Success = the
 * upload did not throw; inspect the bucket to confirm headers and object serialization.
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
      filename_prefix: 'fields-minimal',
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
      delimiter: ',',
      filename_prefix: 'fields-all'
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
      filename_prefix: 'fields-custom',
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
  }
]

export default fixtures
