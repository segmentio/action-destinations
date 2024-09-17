import { generateFile } from '../../functions' // Adjust the import path
import { Payload } from '../generated-types'
// import { Settings } from '../../generated-types';
// import { RawMapping } from '../../types';
// import { Client } from './client'; // Mocking Client is necessary for the send function test

// Define private functions for testing
function snakeCase(str?: string): string {
  if (!str) {
    return ''
  }
  // Replace each uppercase letter with an underscore followed by the letter (except at the start)
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore between lowercase and uppercase letters
    .toLowerCase()
}

function encodeString(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

function getAudienceAction(payload: Payload): boolean | undefined {
  if (!payload.traits_or_props || !payload.computation_key) {
    return undefined
  }

  return (payload?.traits_or_props as Record<string, boolean> | undefined)?.[payload.computation_key] ?? undefined
}
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

// Test send function
// describe('send', () => {
//   it('should call uploadS3 with correct parameters', async () => {
//     const payloads: Payload[] = [{
//       columns: {
//         event_name: 'Test Event'
//       },
//       delimiter: ',',
//       enable_batching: false,
//       file_extension: 'csv',
//       traits_or_props: undefined,
//       computation_key: '',
//       audience_action_column_name: 'action_column'
//     }];

//     const settings: Settings = {
//       iam_role_arn: 'test-role-arn',
//       s3_aws_bucket_name: 'test-bucket',
//       s3_aws_region: 'us-east-1',
//       iam_external_id: 'test-external-id'
//     };

//     const rawMapping: RawMapping = {
//       columns: { event_name: 'Test Event' }
//     };

//     await send(payloads, settings, rawMapping);

//     // Verify that the Client.uploadS3 method was called with the correct parameters
//     const { Client } = require('../../client'); // Import the mocked Client class
//     const instance = Client.mock.instances[0]; // Get the first instance of the mock

//     expect(instance.uploadS3).toHaveBeenCalledWith(
//       settings,
//       expect.any(String), // fileContent (mocked file content)
//       '', // filename_prefix
//       '', // s3_aws_folder_name
//       'csv' // file_extension
//     );
//   });
// });
