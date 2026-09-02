import { isAWSError, buildTimestampedFilename } from '../syncToS3/client'
import { _Error as AWSError } from '@aws-sdk/client-s3'

// Mock AWS SDK before any imports to avoid initialization issues
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  _Error: jest.fn()
}))

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(),
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

  it('appends the configured extension when the prefix ends with a different extension', () => {
    expect(buildTimestampedFilename('report.txt', DATE, 'csv')).toBe(`report.txt_${DATE}.csv`)
  })
})
