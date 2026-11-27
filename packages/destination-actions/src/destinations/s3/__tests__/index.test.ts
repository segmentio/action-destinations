import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import Definition from '../index'
import type { Settings } from '../generated-types'

// Controllable AWS SDK mocks so the perform/performBatch tests can exercise the real syncToS3
// client + file-generation code end to end without hitting AWS. (Previously STSClient was a bare
// jest.fn() with no `send`, so nothing could actually drive perform() through the client.)
const mockStsSend = jest.fn()
const mockS3Send = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
  PutObjectCommand: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({ send: mockStsSend })),
  AssumeRoleCommand: jest.fn()
}))

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { AssumeRoleCommand } from '@aws-sdk/client-sts'

const destination = createTestIntegration(Definition)

const settings: Settings = {
  iam_role_arn: 'arn:aws:iam::123456789012:role/test',
  s3_aws_bucket_name: 'test-bucket',
  s3_aws_region: 'us-east-1',
  iam_external_id: 'external-id'
}

describe('S3 Destination', () => {
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

describe('syncToS3 perform / performBatch (end to end through the real client)', () => {
  // Client.assumeRole() reads these for the intermediary hop.
  const ORIGINAL_ROLE_ADDRESS = process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS
  const ORIGINAL_EXTERNAL_ID = process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID
  beforeAll(() => {
    process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS = 'arn:aws:iam::555555555555:role/segment-intermediary'
    process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID = 'segment-intermediary-external-id'
  })
  afterAll(() => {
    process.env.AMAZON_S3_ACTIONS_ROLE_ADDRESS = ORIGINAL_ROLE_ADDRESS
    process.env.AMAZON_S3_ACTIONS_EXTERNAL_ID = ORIGINAL_EXTERNAL_ID
  })

  beforeEach(() => {
    mockStsSend.mockReset()
    mockS3Send.mockReset()
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA', SecretAccessKey: 'secret', SessionToken: 'token' }
    })
    mockS3Send.mockResolvedValue({})
    ;(PutObjectCommand as unknown as jest.Mock).mockClear()
    ;(AssumeRoleCommand as unknown as jest.Mock).mockClear()
  })

  // audience_action_column_name / batch_size_column_name are set to '' so no extra header columns
  // are appended, keeping the asserted header row deterministic.
  const mapping = {
    columns: { email: { '@path': '$.properties.email' }, user_id: { '@path': '$.userId' } },
    audience_action_column_name: '',
    batch_size_column_name: '',
    delimiter: ',',
    file_extension: 'csv',
    enable_batching: true,
    filename_prefix: 'seg',
    s3_aws_folder_name: 'audiences'
  }

  it('perform: assumes both roles and PUTs a single-row CSV to the configured bucket and key', async () => {
    const event = createTestEvent({ userId: 'u-123', properties: { email: 'a@b.com' } })

    await destination.testAction('syncToS3', { event, settings, mapping })

    // Two-hop assume-role chain ran.
    expect((AssumeRoleCommand as unknown as jest.Mock).mock.calls).toHaveLength(2)

    // Exactly one PUT, to the right bucket, with a dated key under the folder.
    expect(mockS3Send).toHaveBeenCalledTimes(1)
    const putInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0]
    expect(putInput.Bucket).toBe('test-bucket')
    expect(putInput.Key).toMatch(/^audiences\/seg_.*\.csv$/)
    expect(putInput.ContentType).toBe('text/csv')

    const rows = (putInput.Body as Buffer).toString().split('\n')
    expect(rows[0]).toBe('email,user_id')
    expect(rows[1]).toBe('"a@b.com","u-123"')
  })

  it('performBatch: writes one row per event (header + N rows)', async () => {
    const events = [
      createTestEvent({ userId: 'u1', properties: { email: 'a@b.com' } }),
      createTestEvent({ userId: 'u2', properties: { email: 'c@d.com' } })
    ]

    await destination.testBatchAction('syncToS3', { events, settings, mapping })

    expect(mockS3Send).toHaveBeenCalledTimes(1)
    const putInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0]
    const rows = (putInput.Body as Buffer).toString().split('\n')
    expect(rows[0]).toBe('email,user_id')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toBe('"a@b.com","u1"')
    expect(rows[2]).toBe('"c@d.com","u2"')
  })
})

describe('extendRequest', () => {
  it('enforces a minimum 30s request timeout on every request', () => {
    const extendRequest = destination.definition.extendRequest
    expect(extendRequest).toBeDefined()
    const result = extendRequest?.({} as Parameters<NonNullable<typeof extendRequest>>[0])
    // Assert the concrete floor (DEFAULT_REQUEST_TIMEOUT is 10s, so the 30s floor wins) rather
    // than re-deriving it from the same expression as production — this fails if the floor is
    // ever lowered below 30s.
    expect(result).toEqual({ timeout: 30_000 })
  })
})
