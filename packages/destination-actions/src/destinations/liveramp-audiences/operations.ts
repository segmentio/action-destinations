import { createHash } from 'crypto'
import type { Payload } from './audienceEntered/generated-types'

/*
Generates the LiveRamp ingestion file. Expected format:
liveramp_audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: Payload[]) {
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

  const hashOrCache = createHashOrCache()
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
          row.push(`"${hashOrCache(String(payload.unhashed_identifier_data[key]))}"`)
        }
      }
    }
    rows = Buffer.concat([rows, Buffer.from(row.join(payload.delimiter) + (i + 1 === payloads.length) ? '' : '\n')])
  }

  // TODO: verify multiple emails are handled
  const filename = payloads[0].filename
  return { filename, fileContent: rows }
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

// createHashOrCache will cache the unhashed_identifier_data
// to reduce CPU time spent generating sha256
function createHashOrCache() {
  const cache = new Map<string, string>()
  return function hashOrCache(value: string): string {
    if (!cache.has(value)) {
      cache.set(value, hash(value))
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cache.get(value)!
  }
}

const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export { generateFile, enquoteIdentifier }
