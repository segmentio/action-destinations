import type { Payload as S3Payload } from './audienceEnteredS3/generated-types'
import type { Payload as SFTPPayload } from './audienceEnteredSFTP/generated-types'

/*
Generates the LiveRamp ingestion file. Expected format:
liveramp_audience_key[1],identifier_data[0..n]
*/
function generateFile(payloads: S3Payload[] | SFTPPayload[]) {
  const rows = []
  const headers = ['audience_key']
  if (payloads[0].identifier_data) {
    for (const identifier of Object.getOwnPropertyNames(payloads[0].identifier_data)) {
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
    rows.push(row.map(enquoteIdentifier).join(payload.delimiter))
  }

  // STRATCONN-2584: verify multiple emails are handled
  const filename = `${payloads[0].audience_name}_PII_${payloads[0].received_at}.csv`
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

export { generateFile, enquoteIdentifier }
