import { ExecuteInput, RequestClient } from '@segment/actions-core'
import type { Payload as sftpPayload } from './syncToSFTP/generated-types.ts'

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

export type ProcessDataInput<T extends sftpPayload> = {
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
Generates the SFTP upload file. Expected format:
audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: sftpPayload[]) {
  const headers = new Set<string>()
  headers.add('audience_key')

  // Collect all possible headers by examining all payloads first
  // Using a set to avoid duplicates, guarantee unique headers and thus better performance
  for (const payload of payloads) {
    if (payload.identifier_data) {
      for (const key of Object.keys(payload.identifier_data as Record<string, unknown>)) {
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

    row[headerArray.indexOf('audience_key')] = enquoteIdentifier(String(payload.audience_key))

    // Process identifier_data
    if (payload.identifier_data) {
      for (const key of Object.keys(payload.identifier_data as Record<string, unknown>)) {
        const index = headerArray.indexOf(key)
        row[index] = enquoteIdentifier(String(payload.identifier_data[key]))
      }
    }

    // Append the current row to the Buffer without a trailing newline after the last row
    const rowBuffer = Buffer.from(row.join(payload.delimiter as string) + (i + 1 === payloads.length ? '' : '\n'))
    rows = Buffer.concat([rows, rowBuffer])
  }

  // Add headers to the beginning of the file contents
  rows = Buffer.concat([Buffer.from(headerArray.join(payloads[0].delimiter as string) + '\n'), rows])

  const filename = payloads[0].filename
  return { filename, fileContents: rows }
}

/*
  To avoid collision with delimeters, we should surround identifiers with quotation marks.
  
  Examples:
  LCD TV -> "LCD TV"
  LCD TV,50" -> "LCD TV,50"""
*/
function enquoteIdentifier(identifier: string) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

export { enquoteIdentifier, generateFile }
