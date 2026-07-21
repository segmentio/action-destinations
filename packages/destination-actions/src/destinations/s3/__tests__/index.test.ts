import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import nock from 'nock'
const destination = createTestIntegration(Definition)

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
  AssumeRoleCommand: jest.fn()
}))

describe('S3 Destination', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should have the correct destination structure', () => {
    expect(destination).toBeDefined()
    expect(destination.definition.name).toEqual('AWS S3 (Actions)')
    expect(destination.definition.slug).toEqual('actions-s3')
    expect(destination.definition.mode).toEqual('cloud')
    expect(destination.definition.description).toEqual('Sync Segment event data to AWS S3.')

    expect(destination.authentication).toHaveProperty('scheme', 'custom')
    expect(destination.authentication?.fields).toHaveProperty('iam_role_arn')
    expect(destination.authentication?.fields.iam_role_arn).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.iam_role_arn).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('s3_aws_bucket_name')
    expect(destination.authentication?.fields.s3_aws_bucket_name).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.s3_aws_bucket_name).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('s3_aws_region')
    expect(destination.authentication?.fields.s3_aws_region).toHaveProperty('type', 'string')
    expect(destination.authentication?.fields.s3_aws_region).toHaveProperty('required', true)

    expect(destination.authentication?.fields).toHaveProperty('iam_external_id')
    expect(destination.authentication?.fields.iam_external_id).toHaveProperty('type', 'password')
    expect(destination.authentication?.fields.iam_external_id).toHaveProperty('required', true)
  })
})
