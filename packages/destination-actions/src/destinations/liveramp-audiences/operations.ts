import { RequestClient, ExecuteInput } from '@segment/actions-core'
import type { Payload as s3Payload } from './audienceEnteredS3/generated-types'
import type { Payload as sftpPayload } from './audienceEnteredSftp/generated-types'
import { processHashing } from '../../lib/hashing-utils'

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

/*
Generates the LiveRamp ingestion file. Expected format:
liveramp_audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: s3Payload[] | sftpPayload[]) {
  const headers = new Set<string>()
  headers.add('audience_key')

  // Collect all possible headers by examining all payloads first
  // Using a set to avoid duplicates, guarantee unique headers and thus better performance
  for (const payload of payloads) {
    if (payload.unhashed_identifier_data) {
      for (const key of Object.keys(payload.unhashed_identifier_data)) {
        headers.add(key)
      }
    }
    if (payload.identifier_data) {
      for (const key of Object.keys(payload.identifier_data)) {
        headers.add(key)
      }
    }
  }

  // Convert headers to an ordered array for consistent indexing
  const headerArray = Array.from(headers)

  // Declare rows as an empty Buffer
  let rows = Buffer.from('')

  // Prepare data rows
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
    // Initialize row with empty strings aligned with header count
    const row: string[] = new Array(headerArray.length).fill('')

    row[headerArray.indexOf('audience_key')] = enquoteIdentifier(payload.audience_key)

    // Using a set to keep track of unhashed_identifier_data keys that have already been processed
    // This guarantees that when both hashed and unhashed keys share the same key-value pair the unhashed one
    // takes precedence.
    const unhashedKeys = new Set<string>()

    // Process unhashed_identifier_data first
    if (payload.unhashed_identifier_data) {
      for (const key of Object.keys(payload.unhashed_identifier_data)) {
        const index = headerArray.indexOf(key)
        unhashedKeys.add(key)
        /*Identifiers need to be hashed according to LiveRamp spec's: https://docs.liveramp.com/connect/en/formatting-identifiers.html 
        Phone Number requires SHA1 and email uses sha256 */
        if (key === 'phone_number') {
          row[index] = `"${processHashing(String(payload.unhashed_identifier_data[key]), 'sha1', 'hex', (value) =>
            normalize(key, value)
          )}"`
        } else {
          row[index] = `"${processHashing(String(payload.unhashed_identifier_data[key]), 'sha256', 'hex', (value) =>
            normalize(key, value)
          )}"`
        }
      }
    }

    // Process identifier_data, skipping keys if they exist in unhashed_identifier_data
    if (payload.identifier_data) {
      for (const key of Object.keys(payload.identifier_data)) {
        // if a key exists in both identifier_data and unhashed_identifier_data
        // the value from identifier_data will be skipped, prioritizing the unhashed_identifier_data value.
        if (!unhashedKeys.has(key)) {
          const index = headerArray.indexOf(key)
          row[index] = enquoteIdentifier(String(payload.identifier_data[key]))
        }
      }
    }

    // Append the current row to the Buffer without a trailing newline after the last row
    const rowBuffer = Buffer.from(row.join(payload.delimiter) + (i + 1 === payloads.length ? '' : '\n'))
    rows = Buffer.concat([rows, rowBuffer])
  }

  // Add headers to the beginning of the file contents
  rows = Buffer.concat([Buffer.from(headerArray.join(payloads[0].delimiter) + '\n'), rows])

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
      return value.toLowerCase().replace(/\s+/g, '')
    }
  }

  return value
}

export { generateFile, enquoteIdentifier, normalize }
