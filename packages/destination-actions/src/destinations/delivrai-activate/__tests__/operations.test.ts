import { generateFile ,RawData } from '../operations'
import type { Payload } from '../audienceEnteredSftp/generated-types'


describe(`Test operations helper functions:`, () => {
  it('should generate CSV with hashed and unhashed identifier data', async () => {
    const payloads: Payload[] = [
      // Entry with hashed identifier data
      {
        audience_key: 'aud001',
        delimiter: ',',
        identifier_data: {
          email: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
        },
        filename: 'test_file_name.csv',
        enable_batching: true
      },
      // Entry with unhashed identifier data
      {
        audience_key: 'aud002',
        delimiter: ',',
        unhashed_identifier_data: {
          email: 'test@example.com'
        },
        filename: 'test_file_name.csv',
        enable_batching: true
      },
      // Entry with both hashed and unhashed identifier data
      {
        audience_key: 'aud003',
        delimiter: ',',
        identifier_data: {
          email: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
        },
        unhashed_identifier_data: {
          email: 'test@example.com'
        },
        filename: 'test_file_name.csv',
        enable_batching: true
      }
    ];

    const rawData : RawData[] = [{
       email : 'test@test.com'
    }];

    const result = generateFile(payloads,rawData)

    const expectedFileContents = `email\n"test@test.com"`

    expect(result).toMatchObject({
      filename: 'test_file_name.csv',
      fileContents: Buffer.from(expectedFileContents)
    })
  })

  it('should generate CSV even if rows have missing data', async () => {
    const payloads: Payload[] = [
      {
        audience_key: 'aud001',
        delimiter: ',',
        filename: 'test_file_name.csv',
        enable_batching: true
      },
      {
        audience_key: 'aud002',
        delimiter: ',',
        unhashed_identifier_data: {
          email: 'test@example.com'
        },
        filename: 'test_file_name.csv',
        enable_batching: true
      },
      {
        audience_key: 'aud003',
        delimiter: ',',
        unhashed_identifier_data: {
          email: 'test@example.com',
          example_identifier: 'example-id'
        },
        filename: 'test_file_name.csv',
        enable_batching: true
      }
    ]

    const rawData : RawData[] = [{
      email : 'test@test.com'
   }];

    const result = generateFile(payloads,rawData)

    const expectedFileContents = `email\n"test@test.com"`

    expect(result).toMatchObject({
      filename: 'test_file_name.csv',
      fileContents: Buffer.from(expectedFileContents)
    })
  })
})
