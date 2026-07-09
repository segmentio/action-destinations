/**
 * E2E config for the AWS S3 (Actions) destination.
 *
 * These tests write REAL objects to a REAL S3 bucket via the same STS assume-role path the
 * Integrations service uses. There is no HTTP response body to assert on, so fixtures verify only
 * that the upload did not throw (status: 'success') — except the flag-off hashing case, which is
 * expected to throw a PayloadValidationError before any upload (status: 'error'). Inspect the
 * bucket manually to confirm file contents (e.g. that hashed columns are actually hashed).
 *
 * Required environment variables:
 * - E2E_S3_IAM_ROLE_ARN:  IAM role ARN with write access to the bucket (destination setting)
 * - E2E_S3_BUCKET_NAME:   Target S3 bucket name (destination setting)
 * - E2E_S3_REGION:        Bucket region code, e.g. us-east-1 (destination setting)
 * - E2E_S3_EXTERNAL_ID:   External ID for the IAM role (destination setting)
 * - AMAZON_S3_ACTIONS_ROLE_ADDRESS:  Intermediary role ARN the S3 client assumes first (read by client.ts)
 * - AMAZON_S3_ACTIONS_EXTERNAL_ID:   Intermediary external ID (read by client.ts)
 */
import type { E2EDestinationConfig } from '@segment/actions-core'

export const config: E2EDestinationConfig = {
  settings: {
    iam_role_arn: { $env: 'E2E_S3_IAM_ROLE_ARN' },
    s3_aws_bucket_name: { $env: 'E2E_S3_BUCKET_NAME' },
    s3_aws_region: { $env: 'E2E_S3_REGION' },
    iam_external_id: { $env: 'E2E_S3_EXTERNAL_ID' }
  }
}
