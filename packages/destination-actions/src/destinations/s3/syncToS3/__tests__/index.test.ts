import { generateFile, validateColumnsToHash, clean, encodeString, getAudienceAction } from '../functions'
import { Payload } from '../generated-types'
import { ColumnHeader, HashAlgorithm } from '../types'
import { PayloadValidationError } from '@segment/actions-core'
import { processHashing } from '../../../../lib/hashing-utils'

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

describe('encodeString', () => {
  it('should return a string enclosed in double quotes and escaped', () => {
    expect(encodeString('value')).toBe('"value"')
    expect(encodeString('value "with quotes"')).toBe('"value ""with quotes"""')
  })
})

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

describe('generateFile', () => {
  const payloads: Payload[] = [
    {
      columns: {
        event_name: 'Custom Event 1',
        event_type: 'track',
        user_id: 'user_id_1',
        anonymous_id: 'anonymous_id_1',
        email: 'test@test.com',
        properties: {
          prop_str: 'Hello String!',
          prop_num: 123.45,
          prop_bool: true,
          prop_datetime: '2024-01-08T13:52:50.212Z',
          prop_date: '2024-01-08',
          prop_obj: { key1: 'value1', key2: 'value2' },
          prop_arr: ['value1', 'value2'],
          custom_field_1: 'Custom Field Value 1',
          custom_field_2: 'Custom Field Value 2'
        },
        traits: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@test.com'
        },
        context: {
          traits: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'test@test.com'
          },
          personas: {
            computation_key: 'audience_name_1',
            computation_id: 'audience_id_1',
            space_id: 'space_id_1'
          }
        },
        timestamp: '2024-01-08T13:52:50.212Z',
        message_id: 'aaa-bbb-ccc',
        integrations: {},
        audience_name: 'audience_name_1',
        audience_id: 'audience_id_1',
        audience_space_id: 'space_id_1',
        'Custom Field 1': 'Custom Field Value 1',
        'Custom Field 2': 'Custom Field Value 2'
      },
      audience_action_column_name: 'audience_action',
      batch_size_column_name: 'batch_size',
      traits_or_props: {
        audience_name_1: true,
        prop_str: 'Hello String!',
        prop_num: 123.45,
        prop_bool: true,
        prop_datetime: '2024-01-08T13:52:50.212Z',
        prop_date: '2024-01-08',
        prop_obj: { key1: 'value1', key2: 'value2' },
        prop_arr: ['value1', 'value2'],
        custom_field_1: 'Custom Field Value 1',
        custom_field_2: 'Custom Field Value 2'
      },
      computation_key: 'audience_name_1',
      enable_batching: true,
      batch_size: 5000,
      delimiter: ',',
      file_extension: 'csv',
      s3_aws_folder_name: 'foldername1'
    }
  ]

  const headers: ColumnHeader[] = [
    { cleanName: 'event_name', originalName: 'event_name' },
    { cleanName: 'event_type', originalName: 'event_type' },
    { cleanName: 'user_id', originalName: 'user_id' },
    { cleanName: 'anonymous_id', originalName: 'anonymous_id' },
    { cleanName: 'email', originalName: 'email' },
    { cleanName: 'properties', originalName: 'properties' },
    { cleanName: 'traits', originalName: 'traits' },
    { cleanName: 'context', originalName: 'context' },
    { cleanName: 'timestamp', originalName: 'timestamp' },
    { cleanName: 'message_id', originalName: 'message_id' },
    { cleanName: 'integrations', originalName: 'integrations' },
    { cleanName: 'audience_name', originalName: 'audience_name' },
    { cleanName: 'audience_id', originalName: 'audience_id' },
    { cleanName: 'audience_space_id', originalName: 'audience_space_id' },
    { cleanName: 'Custom Field 1', originalName: 'Custom Field 1' },
    { cleanName: 'Custom Field 2', originalName: 'Custom Field 2' },
    { cleanName: 'audience_action', originalName: 'audience_action' },
    { cleanName: 'batch_size', originalName: 'batch_size' }
  ]

  const output = `event_name,event_type,user_id,anonymous_id,email,properties,traits,context,timestamp,message_id,integrations,audience_name,audience_id,audience_space_id,Custom Field 1,Custom Field 2,audience_action,batch_size\n"Custom Event 1","track","user_id_1","anonymous_id_1","test@test.com","{""prop_str"":""Hello String!"",""prop_num"":123.45,""prop_bool"":true,""prop_datetime"":""2024-01-08T13:52:50.212Z"",""prop_date"":""2024-01-08"",""prop_obj"":{""key1"":""value1"",""key2"":""value2""},""prop_arr"":[""value1"",""value2""],""custom_field_1"":""Custom Field Value 1"",""custom_field_2"":""Custom Field Value 2""}","{""first_name"":""John"",""last_name"":""Doe"",""email"":""test@test.com""}","{""traits"":{""first_name"":""John"",""last_name"":""Doe"",""email"":""test@test.com""},""personas"":{""computation_key"":""audience_name_1"",""computation_id"":""audience_id_1"",""space_id"":""space_id_1""}}","2024-01-08T13:52:50.212Z","aaa-bbb-ccc","{}","audience_name_1","audience_id_1","space_id_1","Custom Field Value 1","Custom Field Value 2","true","1"`

  it('should generate a CSV file with correct content', () => {
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size')
    expect(result.toString()).toEqual(output)
  })

  it('should hash specified columns with sha256', () => {
    const columnsToHash = new Map<string, HashAlgorithm>([['email', 'sha256']])
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size', columnsToHash)
    const rows = result.toString().split('\n')
    const headerRow = rows[0].split(',')
    const dataRow = rows[1].split(',')

    const emailIndex = headerRow.indexOf('email')
    const expectedHash = processHashing('test@test.com', 'sha256', 'hex')
    expect(dataRow[emailIndex]).toBe(`"${expectedHash}"`)
  })

  it('should not hash empty or null values', () => {
    const payloadWithEmpty: Payload[] = [
      {
        columns: { email: '', user_id: 'user_1' },
        delimiter: ',',
        enable_batching: true,
        file_extension: 'csv'
      }
    ]
    const testHeaders: ColumnHeader[] = [
      { cleanName: 'email', originalName: 'email' },
      { cleanName: 'user_id', originalName: 'user_id' }
    ]
    const columnsToHash = new Map<string, HashAlgorithm>([
      ['email', 'sha256'],
      ['user_id', 'sha256']
    ])

    const result = generateFile(payloadWithEmpty, testHeaders, ',', undefined, undefined, columnsToHash)
    const rows = result.toString().split('\n')
    const dataRow = rows[1].split(',')

    expect(dataRow[0]).toBe('""')
    const expectedHash = processHashing('user_1', 'sha256', 'hex')
    expect(dataRow[1]).toBe(`"${expectedHash}"`)
  })

  it('should hash multiple columns independently', () => {
    const columnsToHash = new Map<string, HashAlgorithm>([
      ['email', 'sha256'],
      ['user_id', 'sha256']
    ])
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size', columnsToHash)
    const rows = result.toString().split('\n')
    const headerRow = rows[0].split(',')
    const dataRow = rows[1].split(',')

    const emailIndex = headerRow.indexOf('email')
    const userIdIndex = headerRow.indexOf('user_id')

    const expectedEmailHash = processHashing('test@test.com', 'sha256', 'hex')
    const expectedUserIdHash = processHashing('user_id_1', 'sha256', 'hex')

    expect(dataRow[emailIndex]).toBe(`"${expectedEmailHash}"`)
    expect(dataRow[userIdIndex]).toBe(`"${expectedUserIdHash}"`)
  })

  it('should not hash columns not in columnsToHash', () => {
    const columnsToHash = new Map<string, HashAlgorithm>([['email', 'sha256']])
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size', columnsToHash)
    const rows = result.toString().split('\n')
    const headerRow = rows[0].split(',')
    const dataRow = rows[1].split(',')

    const userIdIndex = headerRow.indexOf('user_id')
    expect(dataRow[userIdIndex]).toBe('"user_id_1"')
  })
})

describe('validateColumnsToHash', () => {
  const validColumnNames = new Set(['email', 'user_id', 'anonymous_id', 'event_name'])

  it('should return a valid map when all entries are correct', () => {
    const entries = [
      { column_name: 'email', hash_algorithm: 'sha256' },
      { column_name: 'user_id', hash_algorithm: 'sha256' }
    ]
    const result = validateColumnsToHash(entries, validColumnNames)
    expect(result.size).toBe(2)
    expect(result.get('email')).toBe('sha256')
    expect(result.get('user_id')).toBe('sha256')
  })

  it('should throw when column_name is empty', () => {
    const entries = [{ column_name: '', hash_algorithm: 'sha256' }]
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow('column_name is required')
  })

  it('should throw when hash_algorithm is empty', () => {
    const entries = [{ column_name: 'email', hash_algorithm: '' }]
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow('hash_algorithm is required')
  })

  it('should throw when hash_algorithm is unsupported', () => {
    const entries = [{ column_name: 'email', hash_algorithm: 'md5' }]
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow('unsupported hash_algorithm "md5"')
  })

  it('should throw when column_name does not exist in valid columns', () => {
    const entries = [{ column_name: 'nonexistent_column', hash_algorithm: 'sha256' }]
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow(
      'columns_to_hash contains columns that do not exist: nonexistent_column'
    )
  })

  it('should list all invalid columns in the error message', () => {
    const entries = [
      { column_name: 'bad_col_1', hash_algorithm: 'sha256' },
      { column_name: 'bad_col_2', hash_algorithm: 'sha256' }
    ]
    expect(() => validateColumnsToHash(entries, validColumnNames)).toThrow('bad_col_1, bad_col_2')
  })

  it('should return an empty map when entries is empty', () => {
    const result = validateColumnsToHash([], validColumnNames)
    expect(result.size).toBe(0)
  })
})
