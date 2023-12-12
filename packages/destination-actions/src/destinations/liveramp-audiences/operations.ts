import { RequestClient, ExecuteInput } from '@segment/actions-core'
import { createHash } from 'crypto'
import type { Payload as s3Payload } from './audienceEnteredS3/generated-types'
import type { Payload as sftpPayload } from './audienceEnteredSftp/generated-types'
import { Transform } from 'stream'

// Type definitions
export type RawData = {
  context?: {
    personas?: {
      computation_key?: string
      computation_class?: string
      computation_id?: string
    }
  }
}

export type ProcessDataInput<T extends s3Payload | sftpPayload> = {
  request: RequestClient
  payloads: T[]
  features?: Record<string, boolean>
  rawData?: RawData[]
}

export type ExecuteInputRaw<Settings, Payload, RawData, AudienceSettings = unknown> = ExecuteInput<
  Settings,
  Payload,
  AudienceSettings
> & { rawData?: RawData }

export type SFTPCreds = {
  sftpUsername: string
  sftpPassword: string
}

export type S3Creds = {
  s3_aws_access_key: string
  s3_aws_secret_key: string
  s3_aws_bucket_name: string
  s3_aws_region: string
  file_name: string
}

// This is the function that generates the CSV file
class ObjectToCSVTransformer extends Transform {
  headerWritten: boolean
  sftp: SFTPCreds
  s3: S3Creds
  constructor(options = {}) {
    // Invoke the parent class constructor
    super(Object.assign({ objectMode: true }, options))
    // Initialize CSV header
    this.headerWritten = false
  }
  _transform(payloads: s3Payload[] | sftpPayload[], _encoding: any, callback: (err?: Error) => void) {
    const rows = []
    try {
      // If header is not written, write CSV header
      for (const payload of payloads) {
        if (!this.headerWritten) {
          const headers = ['audience_key']
          if (!this.sftp && (payload as sftpPayload).sftp_password && (payload as sftpPayload).sftp_username) {
            this.sftp = {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              sftpPassword: (payload as sftpPayload).sftp_password!,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              sftpUsername: (payload as sftpPayload).sftp_username!
            }
          }

          if (!this.s3 && (payload as s3Payload).s3_aws_access_key) {
            this.s3 = {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              s3_aws_access_key: (payload as s3Payload).s3_aws_access_key!,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              s3_aws_region: (payload as s3Payload).s3_aws_region!,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              s3_aws_secret_key: (payload as s3Payload).s3_aws_secret_key!,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              s3_aws_bucket_name: (payload as s3Payload).s3_aws_bucket_name!,
              file_name: (payload as s3Payload).filename
            }
          }
          if (payloads[0].identifier_data) {
            for (const identifier of Object.getOwnPropertyNames(payloads[0].identifier_data)) {
              headers.push(identifier)
            }
          }
          if (payloads[0].unhashed_identifier_data) {
            for (const identifier of Object.getOwnPropertyNames(payloads[0].unhashed_identifier_data)) {
              headers.push(identifier)
            }
          }
          this.push(Buffer.from(headers.join(',') + '\n'))
          this.headerWritten = true
        }

        const row: string[] = [enquoteIdentifier(payload.audience_key)]
        if (payload.identifier_data) {
          for (const key in payload.identifier_data) {
            if (Object.prototype.hasOwnProperty.call(payload.identifier_data, key)) {
              row.push(enquoteIdentifier(String(payload.identifier_data[key])))
            }
          }
        }

        if (payload.unhashed_identifier_data) {
          for (const key in payload.unhashed_identifier_data) {
            if (Object.prototype.hasOwnProperty.call(payload.unhashed_identifier_data, key)) {
              row.push(`"${hash(normalize(key, String(payload.unhashed_identifier_data[key])))}"`)
            }
          }
        }
        rows.push(Buffer.from(row.join(',') + '\n'))
      }
      this.push(Buffer.concat(rows))
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }
}

/*
Generates the LiveRamp ingestion file. Expected format:
liveramp_audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: s3Payload[] | sftpPayload[]) {
  // Using a Set to keep track of headers
  const headers = new Set<string>()
  headers.add('audience_key')

  // Declare rows as an empty Buffer
  let rows = Buffer.from('')

  // Prepare data rows
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
    const row: string[] = [enquoteIdentifier(payload.audience_key)]

    // Process unhashed_identifier_data first
    if (payload.unhashed_identifier_data) {
      for (const key in payload.unhashed_identifier_data) {
        if (Object.prototype.hasOwnProperty.call(payload.unhashed_identifier_data, key)) {
          headers.add(key)
          row.push(`"${hash(normalize(key, String(payload.unhashed_identifier_data[key])))}"`)
        }
      }
    }

    // Process identifier_data, skipping keys that have already been processed
    if (payload.identifier_data) {
      for (const key in payload.identifier_data) {
        if (Object.prototype.hasOwnProperty.call(payload.identifier_data, key) && !headers.has(key)) {
          headers.add(key)
          row.push(enquoteIdentifier(String(payload.identifier_data[key])))
        }
      }
    }

    rows = Buffer.concat([rows, Buffer.from(row.join(payload.delimiter) + (i + 1 === payloads.length ? '' : '\n'))])
  }

  // Add headers to the beginning of the file contents
  rows = Buffer.concat([Buffer.from(Array.from(headers).join(payloads[0].delimiter) + '\n'), rows])

  const filename = payloads[0].filename
  return { filename, fileContents: rows }
}

/*
  To avoid collision with delimeters, we should surround identifiers with quotation marks.
  https://docs.liveramp.com/connect/en/formatting-file-data.html#idm45998667347936

  Examples:
  LCD TV -> "LCD TV"
  LCD TV,50" -> "LCD TV,50"""
*/
function enquoteIdentifier(identifier: string) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

/*
  Identifiers need to be hashed according to LiveRamp spec's:
  https://docs.liveramp.com/connect/en/formatting-identifiers.html
*/
const normalize = (key: string, value: string): string => {
  switch (key) {
    case 'phone_number': {
      // Remove all country extensions, parentheses, and hyphens before hashing.
      // For example, if the input phone number is "+1 (555) 123-4567", convert that to "5551234567" before hashing.

      // This regex matches the country code in the first group, and captures the remaining digits.
      // because the captures are optional, the regex works correctly even if some parts of the phone number are missing.
      const phoneRegex = /(?:\+1)?\s*\(?\s*(\d+)\s*-?\)?\s*(\d+)\s*-?\s*(\d+)/
      const match = phoneRegex.exec(value)
      if (!match || match.length < 4) return value

      // Drop the ALL capture. Return the rest of captures joined together.
      return match.slice(1).join('')
    }

    case 'email': {
      return value.toLowerCase().trim()
    }
  }

  return value
}

export { generateFile, enquoteIdentifier, normalize, ObjectToCSVTransformer }
