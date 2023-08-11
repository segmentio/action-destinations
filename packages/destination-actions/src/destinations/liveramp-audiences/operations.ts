import { createHash } from 'crypto'
import type { Payload } from './audienceEnteredS3/generated-types'

/*
Generates the LiveRamp ingestion file. Expected format:
liveramp_audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: Payload[]) {
  const rows = []
  const headers = ['audience_key']

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
  rows.push(headers.join(payloads[0].delimiter))

  // Prepare data rows
  for (const payload of payloads) {
    const row = []
    row.push(payload.audience_key)
    if (payload.identifier_data) {
      for (const identifier of Object.getOwnPropertyNames(payload.identifier_data)) {
        row.push(payload.identifier_data[identifier] as string)
      }
    }

    if (payload.unhashed_identifier_data) {
      for (const identifier of Object.getOwnPropertyNames(payload.unhashed_identifier_data)) {
        row.push(hash(payload.unhashed_identifier_data[identifier] as string))
      }
    }
    rows.push(row.map(enquoteIdentifier).join(payload.delimiter))
  }

  // TODO: verify multiple emails are handled
  const filename = payloads[0].filename
  const fileContent = Buffer.from(rows.join('\n'))

  return { filename, fileContent }
}

/*
  To avoid collision with delimeters, we should surround identifiers with quotation marks.
  https://docs.liveramp.com/connect/en/formatting-file-data.html#idm45998667347936

  Examples:
  LCD TV -> "LCD TV"
  LCD TV,50" -> "LCD TV,50"""
*/
function enquoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

const hash = (value: string): string => {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export { generateFile, enquoteIdentifier }
