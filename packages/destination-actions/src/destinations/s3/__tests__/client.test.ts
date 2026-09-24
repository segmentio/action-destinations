import type { Features } from '@segment/actions-core'
import { Client, isAWSError, buildTimestampedFilename } from '../syncToS3/client'
import { _Error as AWSError } from '@aws-sdk/client-s3'
import { Settings } from '../generated-types'
import { S3_FILENAME_FIX_FLAG } from '../constants'

// Controllable mocks so the filename-fix-flag tests can inspect the S3 key that gets PUT.
const mockStsSend = jest.fn()
const mockS3Send = jest.fn()

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockS3Send
  })),
  // Called with `new`; returning the input object from the mock implementation makes that
  // object the result of the `new` expression (a constructor call that returns an object
  // overrides `this`), so tests can read the Key straight off the S3Client.send() call args.
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => input),
  _Error: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: mockStsSend
  })),
  AssumeRoleCommand: jest.fn()
}))

describe('isAWSError', () => {
  it('should return true for a valid AWS error', () => {
    const error: AWSError = {
      Code: 'AccessDenied',
      Message: 'Access Denied'
    }
    expect(isAWSError(error)).toBe(true)
  })

  it('should return false for a non-AWS error', () => {
    const error = new Error('Some other error')
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for an object without Code and Message properties', () => {
    const error = { name: 'SomeError', message: 'Some error message' }
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for null', () => {
    expect(isAWSError(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isAWSError(undefined)).toBe(false)
  })

  it('should return false for a string', () => {
    expect(isAWSError('Some error')).toBe(false)
  })

  it('should return false for a number', () => {
    expect(isAWSError(123)).toBe(false)
  })

  it('should return false for an object without Code property', () => {
    const error = { Message: 'Some error message' }
    expect(isAWSError(error)).toBe(false)
  })

  it('should return false for an object without Message property', () => {
    const error = { Code: 'SomeError' }
    expect(isAWSError(error)).toBe(false)
  })
})

describe('buildTimestampedFilename', () => {
  const DATE = '2026-09-02T11-23-42-574Z'

  it('inserts the date suffix before the extension for a plain name', () => {
    expect(buildTimestampedFilename('export.csv', DATE, 'csv')).toBe(`export_${DATE}.csv`)
  })

  it('does NOT corrupt a name whose base contains the extension string (regression: STRATCONN-6988)', () => {
    // The old code did filename_prefix.replace('csv', ...), which replaced the
    // leading "csv" in "csv_export" and produced "_<date>.csv_export.csv".
    expect(buildTimestampedFilename('csv_export.csv', DATE, 'csv')).toBe(`csv_export_${DATE}.csv`)
    expect(buildTimestampedFilename('my_txt_report.txt', DATE, 'txt')).toBe(`my_txt_report_${DATE}.txt`)
  })

  it('appends suffix and extension when the prefix has no extension', () => {
    expect(buildTimestampedFilename('export', DATE, 'csv')).toBe(`export_${DATE}.csv`)
  })

  it('uses only the date suffix when the prefix is empty', () => {
    expect(buildTimestampedFilename('', DATE, 'csv')).toBe(`${DATE}.csv`)
  })

  // Regression: previously the mismatched-extension case fell through to naive appending,
  // producing a double-extension key (`report.txt_<date>.csv`) — the same "corrupted-looking
  // filename" symptom this whole fix targets, just for a different input shape. Now any trailing
  // extension-like suffix is replaced by the configured one instead of doubled.
  it('replaces a mismatched trailing extension with the configured one, instead of doubling it', () => {
    expect(buildTimestampedFilename('report.txt', DATE, 'csv')).toBe(`report_${DATE}.csv`)
  })

  it('neutralizes path separators and `..` segments in the prefix (defense in depth against S3 key injection)', () => {
    expect(buildTimestampedFilename('../../etc/passwd', DATE, 'csv')).toBe(`____etc_passwd_${DATE}.csv`)
    expect(buildTimestampedFilename('folder/nested.csv', DATE, 'csv')).toBe(`folder_nested_${DATE}.csv`)
  })
})

describe('uploadS3 filename fix flag', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }

  const flagOn: Features = { [S3_FILENAME_FIX_FLAG]: true }
  const client = new Client('us-east-1', settings.iam_role_arn, settings.iam_external_id)

  beforeEach(() => {
    mockStsSend.mockReset()
    mockS3Send.mockReset()
    mockStsSend.mockResolvedValue({
      Credentials: { AccessKeyId: 'AKIA_TEST', SecretAccessKey: 'secret', SessionToken: 'token' }
    })
    mockS3Send.mockResolvedValue({})
  })

  it('is off by default: the extension can still be corrupted for a name containing it mid-string', async () => {
    await client.uploadS3(settings, 'content', 'csv_export.csv', '', 'csv', undefined)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    // Old (buggy) behavior: filename_prefix.replace('csv', ...) replaces the FIRST occurrence,
    // which is the leading "csv" in "csv_export", not the trailing extension.
    expect(key).toMatch(/^_.*\.csv_export\.csv$/)
  })

  it('when enabled, does not corrupt a name whose base contains the extension string', async () => {
    await client.uploadS3(settings, 'content', 'csv_export.csv', '', 'csv', flagOn)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^csv_export_.*\.csv$/)
  })
})
