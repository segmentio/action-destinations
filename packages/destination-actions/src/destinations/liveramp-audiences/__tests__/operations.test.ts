import { generateFile } from '../operations'
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
    ]

    const result = generateFile(payloads)

    const expectedFileContents = `audience_key,email\n"aud001","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"\n"aud002","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"\n"aud003","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"`

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

    const result = generateFile(payloads)

    const expectedFileContents = `audience_key,email,example_identifier\n"aud001"\n"aud002","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"\n"aud003","973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b","66a0acf498240ea61ce3ce698c5a30eb6824242b39695f8689d7c32499c79748"`

    expect(result).toMatchObject({
      filename: 'test_file_name.csv',
      fileContents: Buffer.from(expectedFileContents)
    })
  })
})
