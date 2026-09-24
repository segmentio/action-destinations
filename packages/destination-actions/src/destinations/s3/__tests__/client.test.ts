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

  it('neutralizes backslash path separators too', () => {
    expect(buildTimestampedFilename('folder\\nested.csv', DATE, 'csv')).toBe(`folder_nested_${DATE}.csv`)
  })

  it('treats a prefix that is only the extension (no base) as empty', () => {
    expect(buildTimestampedFilename('.csv', DATE, 'csv')).toBe(`${DATE}.csv`)
  })

  it('keeps earlier dot-segments intact and only strips the trailing extension-shaped one', () => {
    expect(buildTimestampedFilename('a.b.c.csv', DATE, 'csv')).toBe(`a.b.c_${DATE}.csv`)
    // Mismatched configured extension: only the final ".txt" segment is stripped, not "a.b".
    expect(buildTimestampedFilename('a.b.txt', DATE, 'csv')).toBe(`a.b_${DATE}.csv`)
  })

  it('leaves a bare trailing dot with nothing after it untouched (no extension-shaped suffix to strip)', () => {
    expect(buildTimestampedFilename('name.', DATE, 'csv')).toBe(`name._${DATE}.csv`)
  })

  it('extension matching is case-sensitive: an uppercase extension is treated as mismatched, not matching', () => {
    expect(buildTimestampedFilename('export.CSV', DATE, 'csv')).toBe(`export_${DATE}.csv`)
  })

  it('does not corrupt a name with no dot at all, whether or not it contains the extension as a substring', () => {
    expect(buildTimestampedFilename('plainname', DATE, 'csv')).toBe(`plainname_${DATE}.csv`)
    // Core regression case without a dot: "csv" appears in the name but there's no ".csv" to match/strip.
    expect(buildTimestampedFilename('mycsvfile', DATE, 'csv')).toBe(`mycsvfile_${DATE}.csv`)
  })

  it('works symmetrically in the other direction: a .csv prefix with file_extension txt', () => {
    expect(buildTimestampedFilename('data.csv', DATE, 'txt')).toBe(`data_${DATE}.txt`)
  })

  it('is not hardcoded to csv/txt -- works for any configured extension value', () => {
    expect(buildTimestampedFilename('export.json', DATE, 'json')).toBe(`export_${DATE}.json`)
    expect(buildTimestampedFilename('export.txt', DATE, 'json')).toBe(`export_${DATE}.json`)
  })

  it('handles runs of multiple dots without crashing, still landing on a safe, non-traversal-looking name', () => {
    expect(buildTimestampedFilename('..', DATE, 'csv')).toBe(`__${DATE}.csv`)
    expect(buildTimestampedFilename('...', DATE, 'csv')).toBe(`_._${DATE}.csv`)
    expect(buildTimestampedFilename('....', DATE, 'csv')).toBe(`___${DATE}.csv`)
    // A leading ".." immediately followed by the real extension: neutralized before extension
    // matching runs, so it's treated as a plain (mismatched, dot-less) base rather than re-forming
    // a ".csv"-ending string that would trip the exact-match branch.
    expect(buildTimestampedFilename('..csv', DATE, 'csv')).toBe(`_csv_${DATE}.csv`)
  })

  it('preserves multi-byte unicode characters in the base untouched', () => {
    expect(buildTimestampedFilename('résumé_📁.csv', DATE, 'csv')).toBe(`résumé_📁_${DATE}.csv`)
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

  // The PR's own safety claim: for a filename that was never actually corrupted by the legacy
  // logic (no extension-shaped substring anywhere in the base), flag on and flag off must produce
  // the exact same key -- not just "similarly shaped" keys.
  it('produces a byte-identical key whether the flag is on or off, for a name the legacy path never corrupted', async () => {
    await client.uploadS3(settings, 'content', 'plain_report', '', 'csv', undefined)
    const keyFlagOff = (mockS3Send.mock.calls[0][0] as { Key: string }).Key

    mockS3Send.mockClear()
    await client.uploadS3(settings, 'content', 'plain_report', '', 'csv', flagOn)
    const keyFlagOn = (mockS3Send.mock.calls[0][0] as { Key: string }).Key

    // Both calls happen close enough together that the second-resolution dateSuffix should match;
    // guard against flakiness at a minute boundary by comparing everything up to the timestamp.
    expect(keyFlagOn.replace(/\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/, '')).toBe(
      keyFlagOff.replace(/\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/, '')
    )
    expect(keyFlagOn).toMatch(/^plain_report_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/)
  })

  it('when enabled, prefixes the key with the folder name unchanged, only fixing the filename', async () => {
    await client.uploadS3(settings, 'content', 'csv_export.csv', 'exports/', 'csv', flagOn)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^exports\/csv_export_.*\.csv$/)
  })

  it('when enabled, appends a folder-name slash automatically if the setting omits it', async () => {
    await client.uploadS3(settings, 'content', 'report', 'exports', 'csv', flagOn)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^exports\/report_.*\.csv$/)
  })

  it('when enabled, an empty filename_prefix falls back to just the timestamp and extension', async () => {
    await client.uploadS3(settings, 'content', '', '', 'csv', flagOn)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/)
  })

  it('when enabled, works end-to-end for the txt extension too, including its own mid-string corruption case', async () => {
    await client.uploadS3(settings, 'content', 'txt_report.txt', '', 'txt', flagOn)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^txt_report_.*\.txt$/)
  })

  it('is off by default: an empty filename_prefix matches main (timestamp and extension only)', async () => {
    await client.uploadS3(settings, 'content', '', '', 'csv', undefined)

    const key = (mockS3Send.mock.calls[0][0] as { Key: string }).Key
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.csv$/)
  })
})
