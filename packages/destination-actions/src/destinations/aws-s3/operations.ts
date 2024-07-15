import { ExecuteInput } from '@segment/actions-core'
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

  const headers = []
  const columnsField = payloads[0].columns
  

  // headers = ['audience_name', 'audience_id', 'audience_action', 'email', 'user_id', 'anonymous_id', 'timestamp', 'messageId', 'space_id']

  Object.keys(columnsField).forEach(key => {
    headers.push(columnsField[key])
  })

  const rows = []

  payloads.forEach(payload => {
    const row = []
    if(headers.includes('audience_name')) {
      row.push(payload.audience_name ?? '')
    }
    if(headers.includes('audience_id')) {
      row.push(payload.audience_id ?? '')
    }
    rows.push(row)
  }




  // Using a Set to keep track of headers
  let headers = new Set<string>()
  let rows = Buffer.from('')

  // Prepare data rows
  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
    headers = new Set<string>()

    // Process identifier_data
    if (payload.data) {
      for (const key in payload.data) {
        if (Object.prototype.hasOwnProperty.call(payload.data, key) && !headers.has(key)) {
          headers.add(key)
          row.push(enquoteIdentifier(String(payload.data[key])))
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


export { generateFile, enquoteIdentifier }
