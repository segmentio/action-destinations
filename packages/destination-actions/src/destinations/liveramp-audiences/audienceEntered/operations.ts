import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { uploadS3, validateS3 } from '../s3'

async function processData(request: RequestClient, settings: Settings, payloads: Payload[]) {
  // STRATCONN-2554: Add support for SFTP
  if (settings.upload_mode == 'S3') {
    validateS3(settings)
  } else {
    throw new PayloadValidationError(`Unrecognized upload mode: ${settings.upload_mode}`)
  }
  // STRATCONN-2584: error if less than 25 elements in payload

  // Prepare header row. Expected format:
  // liveramp_audience_key[1],identifier_data[0..n]
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
  const fileContent = rows.join('\n')

  if (settings.upload_mode == 'S3') {
    return await uploadS3(settings, filename, fileContent, request)
  }
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

export { processData, enquoteIdentifier }
