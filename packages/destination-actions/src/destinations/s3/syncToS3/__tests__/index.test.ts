import { generateFile } from '../../functions' // Adjust the import path
import { Payload } from '../generated-types'
import {snakeCase, encodeString, getAudienceAction} from '../../functions'

// Mock Client class
jest.mock('../../client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      assumeRole: jest.fn().mockResolvedValue({
        accessKeyId: 'mockAccessKeyId',
        secretAccessKey: 'mockSecretAccessKey',
        sessionToken: 'mockSessionToken'
      }),
      uploadS3: jest.fn().mockResolvedValue({
        statusCode: 200,
        message: 'Upload successful'
      })
    }))
  }
})

// Test snakeCase function
describe('snakeCase', () => {
  it('should convert camelCase to snake_case', () => {
    expect(snakeCase('abcdEfg')).toEqual('abcd_efg')
  })

  it('should handle undefined input', () => {
    expect(snakeCase(undefined)).toBe('')
  })

  it('should handle empty string', () => {
    expect(snakeCase('')).toBe('')
  })
})

// Test encodeString function
describe('encodeString', () => {
  it('should return a string enclosed in double quotes and escaped', () => {
    expect(encodeString('value')).toBe('"value"')
    expect(encodeString('value "with quotes"')).toBe('"value ""with quotes"""')
  })
})

// Test getAudienceAction function
describe('getAudienceAction', () => {
  it('should return undefined if traits_or_props or computation_key are not defined', () => {
    const payload: Payload = {
      traits_or_props: undefined,
      computation_key: '',
      columns: {},
      delimiter: ',',
      enable_batching: false,
      file_extension: 'csv'
    }
    expect(getAudienceAction(payload)).toBeUndefined()
  })

  it('should return the correct boolean value based on traits_or_props and computation_key', () => {
    const payload: Payload = {
      traits_or_props: { key: true },
      computation_key: 'key',
      columns: {},
      delimiter: ',',
      enable_batching: false,
      file_extension: 'csv'
    }
    expect(getAudienceAction(payload)).toBe(true)
  })
})

// Test generateFile function
describe('generateFile', () => {
  it('should generate a CSV file with correct content', () => {
    const payloads: Payload[] = [
      {
        columns: {
          event_name: 'Test Event'
        },
        delimiter: ',',
        enable_batching: false,
        file_extension: 'csv'
      }
    ]
    const headers = ['event_name']
    const result = generateFile(payloads, headers, ',', 'action_column')
    expect(result).toContain('Test Event')
  })
})