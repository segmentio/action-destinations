import {
  generateFile,
  resolveColumnTransforms,
  getNormalizer,
  clean,
  encodeString,
  getAudienceAction,
  send
} from '../functions'
import { Payload } from '../generated-types'
import { Settings } from '../../generated-types'
import { ColumnHeader, ColumnTransform, RawMapping } from '../types'
import { PayloadValidationError } from '@segment/actions-core'
import { S3_HASHING_FEATURE_FLAG } from '../../constants'
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

// Mock the S3 Client so send() can complete without hitting AWS. The flag guard under test
// throws before the Client is ever constructed, so this only matters for the non-throwing cases.
jest.mock('../client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    uploadS3: jest.fn().mockResolvedValue({ statusCode: 200, message: 'Upload successful' })
  }))
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
    const columnsToHash = new Map<string, ColumnTransform>([['email', { algorithm: 'sha256', normalize: 'none' }]])
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
    const columnsToHash = new Map<string, ColumnTransform>([
      ['email', { algorithm: 'sha256', normalize: 'none' }],
      ['user_id', { algorithm: 'sha256', normalize: 'none' }]
    ])

    const result = generateFile(payloadWithEmpty, testHeaders, ',', undefined, undefined, columnsToHash)
    const rows = result.toString().split('\n')
    const dataRow = rows[1].split(',')

    expect(dataRow[0]).toBe('""')
    const expectedHash = processHashing('user_1', 'sha256', 'hex')
    expect(dataRow[1]).toBe(`"${expectedHash}"`)
  })

  it('should hash multiple columns independently', () => {
    const columnsToHash = new Map<string, ColumnTransform>([
      ['email', { algorithm: 'sha256', normalize: 'none' }],
      ['user_id', { algorithm: 'sha256', normalize: 'none' }]
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
    const columnsToHash = new Map<string, ColumnTransform>([['email', { algorithm: 'sha256', normalize: 'none' }]])
    const result = generateFile(payloads, headers, ',', 'audience_action', 'batch_size', columnsToHash)
    const rows = result.toString().split('\n')
    const headerRow = rows[0].split(',')
    const dataRow = rows[1].split(',')

    const userIdIndex = headerRow.indexOf('user_id')
    expect(dataRow[userIdIndex]).toBe('"user_id_1"')
  })

  const normalizePayloads: Payload[] = [
    {
      columns: { email: '  Test@Test.com  ', user_id: 'User_1' },
      delimiter: ',',
      enable_batching: true,
      file_extension: 'csv'
    }
  ]
  const normalizeHeaders: ColumnHeader[] = [
    { cleanName: 'email', originalName: 'email' },
    { cleanName: 'user_id', originalName: 'user_id' }
  ]

  const readColumn = (buffer: Buffer, column: string): string => {
    const rows = buffer.toString().split('\n')
    const index = rows[0].split(',').indexOf(column)
    return rows[1].split(',')[index]
  }

  it('should normalize (lowercase) without hashing when algorithm is omitted', () => {
    const transforms = new Map<string, ColumnTransform>([['email', { normalize: 'lowercase' }]])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    expect(readColumn(result, 'email')).toBe('"  test@test.com  "')
  })

  it('should normalize (trim) without hashing', () => {
    const transforms = new Map<string, ColumnTransform>([['email', { normalize: 'trim' }]])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    expect(readColumn(result, 'email')).toBe('"Test@Test.com"')
  })

  it('should normalize (lowercase_trim) without hashing', () => {
    const transforms = new Map<string, ColumnTransform>([['email', { normalize: 'lowercase_trim' }]])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    expect(readColumn(result, 'email')).toBe('"test@test.com"')
  })

  it('should leave the value unchanged when normalize is none and no algorithm is set', () => {
    const transforms = new Map<string, ColumnTransform>([['email', { normalize: 'none' }]])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    expect(readColumn(result, 'email')).toBe('"  Test@Test.com  "')
  })

  it('should normalize before hashing (hash of the normalized value)', () => {
    const transforms = new Map<string, ColumnTransform>([
      ['email', { algorithm: 'sha256', normalize: 'lowercase_trim' }]
    ])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    const expectedHash = processHashing('  Test@Test.com  ', 'sha256', 'hex', (v) => v.trim().toLowerCase())
    expect(readColumn(result, 'email')).toBe(`"${expectedHash}"`)
    // Sanity: this equals hashing the pre-normalized string directly.
    expect(expectedHash).toBe(processHashing('test@test.com', 'sha256', 'hex'))
  })

  it('should hash the raw value (no normalization) when normalize is none', () => {
    const transforms = new Map<string, ColumnTransform>([['email', { algorithm: 'sha256', normalize: 'none' }]])
    const result = generateFile(normalizePayloads, normalizeHeaders, ',', undefined, undefined, transforms)
    // Hash of the untouched value, NOT the lower-cased / trimmed one.
    const expectedHash = processHashing('  Test@Test.com  ', 'sha256', 'hex')
    expect(readColumn(result, 'email')).toBe(`"${expectedHash}"`)
    // Guard against silent normalization: the raw hash must differ from the normalized hash.
    expect(expectedHash).not.toBe(processHashing('test@test.com', 'sha256', 'hex'))
  })

  it('should not normalize an already-hashed value when hashing', () => {
    const alreadyHashed = processHashing('test@test.com', 'sha256', 'hex')
    const payload: Payload[] = [
      { columns: { email: alreadyHashed }, delimiter: ',', enable_batching: true, file_extension: 'csv' }
    ]
    const transforms = new Map<string, ColumnTransform>([
      ['email', { algorithm: 'sha256', normalize: 'lowercase_trim' }]
    ])
    const result = generateFile(
      payload,
      [{ cleanName: 'email', originalName: 'email' }],
      ',',
      undefined,
      undefined,
      transforms
    )
    // The value is passed through untouched (not re-hashed, not lower-cased).
    expect(readColumn(result, 'email')).toBe(`"${alreadyHashed}"`)
  })
})

describe('getNormalizer', () => {
  it('returns undefined for none / undefined', () => {
    expect(getNormalizer('none')).toBeUndefined()
    expect(getNormalizer(undefined)).toBeUndefined()
  })
  it('lowercases', () => {
    const normalize = getNormalizer('lowercase')
    expect(normalize?.('AbC ')).toBe('abc ')
  })
  it('trims', () => {
    const normalize = getNormalizer('trim')
    expect(normalize?.('  AbC  ')).toBe('AbC')
  })
  it('lowercases and trims', () => {
    const normalize = getNormalizer('lowercase_trim')
    expect(normalize?.('  AbC  ')).toBe('abc')
  })
})

describe('resolveColumnTransforms', () => {
  const validColumnNames = new Set(['email', 'user_id', 'anonymous_id', 'event_name'])

  it('should return a valid map when all entries are correct', () => {
    const entries = [
      { column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' },
      { column_name: 'user_id', hash_algorithm: 'sha256', normalize: 'lowercase' }
    ]
    const result = resolveColumnTransforms(entries, validColumnNames)
    expect(result.size).toBe(2)
    expect(result.get('email')).toEqual({ algorithm: 'sha256', normalize: 'none' })
    expect(result.get('user_id')).toEqual({ algorithm: 'sha256', normalize: 'lowercase' })
  })

  it('should treat hash_algorithm "none" as normalize-only (no algorithm)', () => {
    const entries = [{ column_name: 'email', hash_algorithm: 'none', normalize: 'lowercase_trim' }]
    const result = resolveColumnTransforms(entries, validColumnNames)
    expect(result.get('email')).toEqual({ algorithm: undefined, normalize: 'lowercase_trim' })
  })

  it('should treat an empty hash_algorithm as normalize-only (no algorithm)', () => {
    const entries = [{ column_name: 'email', hash_algorithm: '', normalize: 'trim' }]
    const result = resolveColumnTransforms(entries, validColumnNames)
    expect(result.get('email')).toEqual({ algorithm: undefined, normalize: 'trim' })
  })

  it('should default a missing normalize to "none"', () => {
    const entries = [
      { column_name: 'email', hash_algorithm: 'sha256' } as unknown as {
        column_name: string
        hash_algorithm: string
        normalize: string
      }
    ]
    const result = resolveColumnTransforms(entries, validColumnNames)
    expect(result.get('email')).toEqual({ algorithm: 'sha256', normalize: 'none' })
  })

  it('should throw when column_name is empty', () => {
    const entries = [{ column_name: '', hash_algorithm: 'sha256', normalize: 'none' }]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow('column_name is required')
  })

  it('should throw when hash_algorithm is unsupported', () => {
    const entries = [{ column_name: 'email', hash_algorithm: 'md5', normalize: 'none' }]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow('unsupported hash_algorithm "md5"')
  })

  it('should throw when normalize is unsupported', () => {
    const entries = [{ column_name: 'email', hash_algorithm: 'none', normalize: 'uppercase' }]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow('unsupported normalize "uppercase"')
  })

  it('should throw when column_name does not exist in valid columns', () => {
    const entries = [{ column_name: 'nonexistent_column', hash_algorithm: 'sha256', normalize: 'none' }]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(
      'columns_to_transform contains columns that do not exist: nonexistent_column'
    )
  })

  it('should list all invalid columns in the error message', () => {
    const entries = [
      { column_name: 'bad_col_1', hash_algorithm: 'sha256', normalize: 'none' },
      { column_name: 'bad_col_2', hash_algorithm: 'sha256', normalize: 'none' }
    ]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow('bad_col_1, bad_col_2')
  })

  it('should throw when column_name is duplicated', () => {
    const entries = [
      { column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' },
      { column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' }
    ]
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow(PayloadValidationError)
    expect(() => resolveColumnTransforms(entries, validColumnNames)).toThrow('duplicate column_name "email"')
  })

  it('should return an empty map when entries is empty', () => {
    const result = resolveColumnTransforms([], validColumnNames)
    expect(result.size).toBe(0)
  })
})

describe('send with hashing feature flag', () => {
  const settings: Settings = {
    iam_role_arn: 'arn:aws:iam::123456789012:role/test',
    s3_aws_bucket_name: 'test-bucket',
    s3_aws_region: 'us-east-1',
    iam_external_id: 'external-id'
  }
  const rawMapping: RawMapping = { columns: { email: 'email', user_id: 'user_id' } }

  const payloadWithHashing: Payload = {
    columns: { email: 'test@test.com', user_id: 'user_1' },
    delimiter: ',',
    enable_batching: true,
    file_extension: 'csv',
    columns_to_transform: [{ column_name: 'email', hash_algorithm: 'sha256', normalize: 'none' }]
  }

  it('should throw when columns_to_transform is configured but the feature flag is off', async () => {
    await expect(send([payloadWithHashing], settings, rawMapping, {})).rejects.toThrow(PayloadValidationError)
    await expect(send([payloadWithHashing], settings, rawMapping, undefined)).rejects.toThrow(
      'Column hashing and normalization is currently not enabled for your Segment workspace. Remove the columns to hash / normalize or contact Segment by emailing friends@segment.com to enable the feature.'
    )
  })

  it('should not throw when the feature flag is off and no columns are configured', async () => {
    const payloadNoHashing: Payload = {
      columns: { email: 'test@test.com', user_id: 'user_1' },
      delimiter: ',',
      enable_batching: true,
      file_extension: 'csv'
    }
    await expect(send([payloadNoHashing], settings, rawMapping, {})).resolves.not.toThrow()
  })

  it('should not throw when columns_to_transform is configured and the feature flag is on', async () => {
    await expect(
      send([payloadWithHashing], settings, rawMapping, { [S3_HASHING_FEATURE_FLAG]: true })
    ).resolves.not.toThrow()
  })

  it('should not throw for a normalize-only column when the feature flag is on', async () => {
    const payloadNormalizeOnly: Payload = {
      columns: { email: 'Test@Test.com', user_id: 'user_1' },
      delimiter: ',',
      enable_batching: true,
      file_extension: 'csv',
      columns_to_transform: [{ column_name: 'email', hash_algorithm: 'none', normalize: 'lowercase_trim' }]
    }
    await expect(
      send([payloadNormalizeOnly], settings, rawMapping, { [S3_HASHING_FEATURE_FLAG]: true })
    ).resolves.not.toThrow()
  })
})
