import { MultiStatusResponse } from '@segment/actions-core'
import { uploadSFTP } from '../client'
import { SFTP_DEFAULT_PORT } from '../constants'
import {
  clean,
  createFilename,
  enquoteIdentifier,
  generateFile,
  getAudienceAction,
  processField,
  send
} from '../functions'
import { Settings } from '../generated-types'
import type { Payload } from '../syncEvents/generated-types'
import type { ColumnHeader, RawMapping } from '../types'

// Mock the client functions
jest.mock('../client')
const mockUploadSFTP = uploadSFTP as jest.MockedFunction<typeof uploadSFTP>

// Test helpers and shared data
const createTestPayload = (overrides: Partial<Payload> = {}): Payload => ({
  sftp_folder_path: '/uploads',
  delimiter: ',',
  filename_prefix: 'test_filename_',
  enable_batching: true,
  file_extension: 'csv',
  batch_size: 100000,
  columns: {},
  ...overrides
})

const createTestHeaders = (): ColumnHeader[] => [
  { cleanName: 'email', originalName: 'email' },
  { cleanName: 'name', originalName: 'name' }
]

describe('generateFile', () => {
  it('should generate CSV file with headers', () => {
    const payloads: Payload[] = [
      createTestPayload({
        columns: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      })
    ]

    const headers = createTestHeaders()
    const rowsObservabilityArray: string[] = []
    const result = generateFile(payloads, headers, ',', rowsObservabilityArray)

    expect(result).toBeInstanceOf(Buffer)

    const content = result.toString()
    expect(content).toContain('email,name')
    expect(content).toContain('"test@example.com","John Doe"')
  })

  it('should handle multiple payloads', () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test.csv',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test1@example.com',
          name: ''
        }
      },
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test.csv',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test2@example.com',
          name: 'Jane Smith'
        }
      }
    ]

    const headers: ColumnHeader[] = [
      { cleanName: 'email', originalName: 'email' },
      { cleanName: 'name', originalName: 'name' }
    ]

    const rowsObservabilityArray: string[] = []
    const result = generateFile(payloads, headers, ',', rowsObservabilityArray)
    const content = result.toString()

    // Should contain both users
    expect(content).toContain('"test1@example.com"')
    expect(content).toContain('"test2@example.com"')
    expect(content).toContain('"Jane Smith"')
  })

  it('should handle different delimiters', () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: '|',
        filename_prefix: 'test.csv',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com'
        }
      }
    ]

    const headers: ColumnHeader[] = [{ cleanName: 'email', originalName: 'email' }]

    const rowsObservabilityArray: string[] = []
    const result = generateFile(payloads, headers, '|', rowsObservabilityArray)
    const content = result.toString()

    expect(content).toContain('email')
    expect(content).toContain('"test@example.com"')
  })

  it('should handle empty headers', () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test.csv',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {}
      }
    ]

    const headers: ColumnHeader[] = []
    const rowsObservabilityArray: string[] = []
    const result = generateFile(payloads, headers, ',', rowsObservabilityArray)
    const content = result.toString()

    expect(content).toBe('\n')
  })
})

describe('enquoteIdentifier', () => {
  it('should quote values correctly', () => {
    expect(enquoteIdentifier('simple')).toBe('"simple"')
    expect(enquoteIdentifier('123')).toBe('"123"')
    expect(enquoteIdentifier('')).toBe('""')
  })

  it('should escape quotes within identifiers', () => {
    expect(enquoteIdentifier('LCD TV,50"')).toBe('"LCD TV,50"""')
    expect(enquoteIdentifier('Say "Hello"')).toBe('"Say ""Hello"""')
  })

  it('should handle strings with delimiters', () => {
    expect(enquoteIdentifier('Hello, World')).toBe('"Hello, World"')
    expect(enquoteIdentifier('A;B;C')).toBe('"A;B;C"')
    expect(enquoteIdentifier('with,comma')).toBe('"with,comma"')
  })
})

describe('clean', () => {
  it('should remove specified delimiter from string', () => {
    expect(clean(',', 'test,string')).toBe('teststring')
    expect(clean('|', 'test|string')).toBe('teststring')
  })

  it('should handle tab delimiter', () => {
    expect(clean('tab', 'test\tstring')).toBe('test\tstring') // Should not remove tab
  })

  it('should return empty string if no input provided', () => {
    expect(clean(',', '')).toBe('')
    expect(clean('|')).toBe('')
  })
})

describe('createFilename', () => {
  // Mock Date.now to ensure consistent test results
  const mockDate = new Date('2023-07-26T15:23:39.803Z')
  const expectedTimestamp = '2023-07-26T15-23-39-803Z'

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create filename with prefix and timestamp when prefix does not end with extension', () => {
    const result = createFilename('test_prefix', 'csv')
    expect(result).toBe(`test_prefix__${expectedTimestamp}.csv`)
  })

  it('should handle prefix that already ends with extension', () => {
    const result = createFilename('test_file.csv', 'csv')
    expect(result).toBe(`test_file__${expectedTimestamp}.csv`)
  })

  it('should handle empty prefix', () => {
    const result = createFilename('', 'csv')
    expect(result).toBe(`${expectedTimestamp}.csv`)
  })

  it('should handle different file extensions', () => {
    const result = createFilename('data', 'txt')
    expect(result).toBe(`data__${expectedTimestamp}.txt`)
  })

  it('should handle prefix with different extension than file_extension', () => {
    const result = createFilename('report.csv', 'txt')
    expect(result).toBe(`report.csv__${expectedTimestamp}.txt`)
  })
})

describe('processField', () => {
  it('should handle string values', () => {
    expect(processField('test string')).toBe('"test string"')
  })

  it('should handle number values', () => {
    expect(processField(123)).toBe('"123"')
    expect(processField(0)).toBe('"0"')
    expect(processField(-456)).toBe('"-456"')
  })

  it('should handle boolean values', () => {
    expect(processField(true)).toBe('"true"')
    expect(processField(false)).toBe('"false"')
  })

  it('should handle null values', () => {
    expect(processField(null)).toBe('""')
  })

  it('should handle undefined values', () => {
    expect(processField(undefined)).toBe('""')
  })

  it('should handle object values by JSON stringifying', () => {
    const obj = { key: 'value', number: 42 }
    expect(processField(obj)).toBe('"{""key"":""value"",""number"":42}"')
  })

  it('should handle array values by JSON stringifying', () => {
    const arr = ['item1', 'item2', 123]
    expect(processField(arr)).toBe('"[""item1"",""item2"",123]"')
  })

  it('should handle empty string', () => {
    expect(processField('')).toBe('""')
  })

  it('should handle nested objects', () => {
    const nested = {
      user: {
        name: 'John',
        preferences: { theme: 'dark' }
      }
    }
    expect(processField(nested)).toBe('"{""user"":{""name"":""John"",""preferences"":{""theme"":""dark""}}}"')
  })
})

describe('getAudienceAction', () => {
  it('should return boolean value when computation_key exists in traits_or_props', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {},
      traits_or_props: { audience_123: true },
      computation_key: 'audience_123'
    }

    expect(getAudienceAction(payload)).toBe(true)
  })

  it('should return false when computation_key exists but value is false', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {},
      traits_or_props: { audience_123: false },
      computation_key: 'audience_123'
    }

    expect(getAudienceAction(payload)).toBe(false)
  })

  it('should return undefined when computation_key does not exist in traits_or_props', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {},
      traits_or_props: { other_key: true },
      computation_key: 'audience_123'
    }

    expect(getAudienceAction(payload)).toBe(undefined)
  })

  it('should return undefined when traits_or_props is missing', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {},
      computation_key: 'audience_123'
    }

    expect(getAudienceAction(payload)).toBe(undefined)
  })

  it('should return undefined when computation_key is missing', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {},
      traits_or_props: { audience_123: true }
    }

    expect(getAudienceAction(payload)).toBe(undefined)
  })

  it('should return undefined when both traits_or_props and computation_key are missing', () => {
    const payload: Payload = {
      sftp_folder_path: '/uploads',
      delimiter: ',',
      filename_prefix: 'test',
      enable_batching: true,
      file_extension: 'csv',
      batch_size: 100000,
      columns: {}
    }

    expect(getAudienceAction(payload)).toBe(undefined)
  })
})

describe('send', () => {
  const mockSettings: Settings = {
    auth_type: 'password',
    sftp_host: 'test.example.com',
    sftp_username: 'testuser',
    sftp_password: 'testpass',
    sftp_port: SFTP_DEFAULT_PORT
  }

  const mockRawMapping: RawMapping = {
    columns: {
      email: '$.properties.email',
      name: '$.properties.name',
      user_id: '$.userId'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUploadSFTP.mockResolvedValue(undefined)
  })

  it('should throw PayloadValidationError when no headers are mapped', async () => {
    // Test case 1: Empty rawMapping.columns
    const emptyRawMapping: RawMapping = {
      columns: {}
    }

    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {}
      }
    ]

    await expect(send(payloads, mockSettings, emptyRawMapping)).rejects.toThrow('No columns headers specified')
  })

  it('should validate SFTP settings and upload file', async () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      }
    ]

    await send(payloads, mockSettings, mockRawMapping)

    expect(mockUploadSFTP).toHaveBeenCalledWith(
      mockSettings,
      '/uploads',
      expect.any(String), // filename
      expect.any(Buffer) // file content
    )
  })

  it('should include action column when audience_action_column_name is provided', async () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com'
        },
        audience_action_column_name: 'action',
        traits_or_props: { audience_123: true },
        computation_key: 'audience_123'
      }
    ]

    await send(payloads, mockSettings, mockRawMapping)

    expect(mockUploadSFTP).toHaveBeenCalled()
    const [, , , fileContent] = mockUploadSFTP.mock.calls[0]
    const content = fileContent.toString()

    // Should include action column header
    expect(content).toContain('action')
    expect(content).toContain('true')
  })

  it('should include batch size column when batch_size_column_name is provided', async () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com'
        },
        batch_size_column_name: 'batch_size'
      }
    ]

    await send(payloads, mockSettings, mockRawMapping)

    expect(mockUploadSFTP).toHaveBeenCalled()
    const [, , , fileContent] = mockUploadSFTP.mock.calls[0]
    const content = fileContent.toString()

    // Should include batch size column header and value
    expect(content).toContain('batch_size')
    expect(content).toContain('1') // Should show batch size of 1
  })

  it('should handle tab delimiter', async () => {
    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: 'tab',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      }
    ]

    await send(payloads, mockSettings, mockRawMapping)

    expect(mockUploadSFTP).toHaveBeenCalled()
    const [, , , fileContent] = mockUploadSFTP.mock.calls[0]
    const content = fileContent.toString()

    // Should use tab delimiter
    expect(content).toContain('\t')
  })

  it('should filter out empty column values from rawMapping', async () => {
    const rawMappingWithEmpty: RawMapping = {
      columns: {
        email: '$.properties.email',
        empty_field: '',
        name: '$.properties.name'
      }
    }

    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      }
    ]

    await send(payloads, mockSettings, rawMappingWithEmpty)

    expect(mockUploadSFTP).toHaveBeenCalled()
    const [, , , fileContent] = mockUploadSFTP.mock.calls[0]
    const content = fileContent.toString()

    // Should not include empty_field in headers
    expect(content).not.toContain('empty_field')
    expect(content).toContain('email')
    expect(content).toContain('name')
  })

  it('should return error responses when uploadSFTP fails', async () => {
    const uploadError = new Error('SFTP connection failed')
    mockUploadSFTP.mockRejectedValue(uploadError)

    // Spy on MultiStatusResponse methods
    const setErrorSpy = jest.spyOn(MultiStatusResponse.prototype, 'setErrorResponseAtIndex')

    const payloads: Payload[] = [
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test1@example.com',
          name: 'John Doe'
        }
      },
      {
        sftp_folder_path: '/uploads',
        delimiter: ',',
        filename_prefix: 'test',
        enable_batching: true,
        file_extension: 'csv',
        batch_size: 100000,
        columns: {
          email: 'test2@example.com',
          name: 'Jane Smith'
        }
      }
    ]

    const result = await send(payloads, mockSettings, mockRawMapping)

    // Should still call uploadSFTP and get the error
    expect(mockUploadSFTP).toHaveBeenCalled()

    // Should return a MultiStatusResponse
    expect(result).toBeDefined()

    // Should have called setErrorResponseAtIndex for each payload
    expect(setErrorSpy).toHaveBeenCalledTimes(2)

    // Verify the error responses were set correctly
    expect(setErrorSpy).toHaveBeenCalledWith(0, {
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: 'SFTP connection failed',
      sent: {
        batch_size: 100000,
        columns: {
          email: 'test1@example.com',
          name: 'John Doe'
        },
        delimiter: ',',
        enable_batching: true,
        file_extension: 'csv',
        filename_prefix: 'test',
        sftp_folder_path: '/uploads'
      },
      body: 'Header row = email,name,user_id. Row content ="test1@example.com","John Doe",""\n'
    })

    expect(setErrorSpy).toHaveBeenCalledWith(1, {
      status: 400,
      errortype: 'BAD_REQUEST',
      errormessage: 'SFTP connection failed',
      sent: {
        batch_size: 100000,
        columns: { email: 'test2@example.com', name: 'Jane Smith' },
        delimiter: ',',
        enable_batching: true,
        file_extension: 'csv',
        filename_prefix: 'test',
        sftp_folder_path: '/uploads'
      },
      body: 'Header row = email,name,user_id. Row content ="test2@example.com","Jane Smith",""'
    })

    setErrorSpy.mockRestore()
  })
})
