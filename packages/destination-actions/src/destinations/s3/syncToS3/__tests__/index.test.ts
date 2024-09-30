import { generateFile } from '../../functions' // Adjust the import path
import { Payload } from '../generated-types'
import { clean, encodeString, getAudienceAction } from '../../functions'
import { ColumnHeader } from '../../types'

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
describe('clean', () => {
  it('should remove delimiter from string', () => {
    expect(clean(',', 'abcd,Efg')).toEqual('abcdEfg')
  })

  it('should handle undefined input', () => {
    expect(clean(',', '')).toBe('')
  })

  it('should handle empty string', () => {
    expect(clean('')).toBe('')
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
    const headers: ColumnHeader[] = [{ cleanName: 'event_name', originalName: 'event_name' }]
    const result = generateFile(payloads, headers, ',', 'action_column')
    expect(result).toContain('Test Event')
  })
})
