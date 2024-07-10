import { ExecuteInput } from '@segment/actions-core'
import { createHash } from 'crypto'
import type { Payload } from './syncAudienceToCSV/generated-types'
import type { AudienceSettings, Settings } from './generated-types'


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

export type ExecuteInputRaw<Settings, Payload, RawData, AudienceSettings = unknown> = ExecuteInput<
  Settings,
  Payload,
  AudienceSettings
> & { rawData?: RawData }

function generateFile(payloads: Payload[], settings: Settings, audienceSettings: AudienceSettings) {

  // Using a Set to keep track of headers
  let headers = new Set<string>()
  let rows = Buffer.from('')

  // Prepare data rows
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
    headers = new Set<string>()

    if (payloads[0].is_audience) {
      headers.add('audience_key')
    }

    const row: string[] = payload.is_audience ? [enquoteIdentifier(payload.computation_key || '')] : []

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

    rows = Buffer.concat([rows, Buffer.from(row.join(settings.delimiter) + (i + 1 === payloads.length ? '' : '\n'))])
  }

  // Add headers to the beginning of the file contents
  rows = Buffer.concat([Buffer.from(Array.from(headers).join(settings.delimiter) + '\n'), rows])

  return { filename: audienceSettings?.filename, fileContents: rows }
}

function enquoteIdentifier(identifier: string) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
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
      return value.toLowerCase().trim()
    }
  }

  return value
}

export { generateFile, enquoteIdentifier, normalize }
