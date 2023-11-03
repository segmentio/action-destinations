import { RequestClient, ExecuteInput } from '@segment/actions-core'
import { createHash } from 'crypto'
import type { Payload as s3Payload } from './audienceEnteredS3/generated-types'
import type { Payload as sftpPayload } from './audienceEnteredSftp/generated-types'

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
  const headers: string[] = ['audience_key']

  // Prepare header row
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

  let rows = Buffer.from(headers.join(payloads[0].delimiter) + '\n')

  // Prepare data rows
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
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
    rows = Buffer.concat([rows, Buffer.from(row.join(payload.delimiter) + (i + 1 === payloads.length ? '' : '\n'))])
  }

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

export { generateFile, enquoteIdentifier, normalize }
