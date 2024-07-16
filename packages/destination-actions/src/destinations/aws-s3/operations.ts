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

  Object.keys(columnsField).forEach((key) => {
    headers.push(columnsField[key])
  })

  const rows = []

  // let rows = Buffer.from('')

  payloads.forEach((payload) => {
    const row: string[] = []
    if (headers.includes('audience_name')) {
      row.push(payload.audienceName ?? '')
    }
    if (headers.includes('audience_id')) {
      row.push(enquoteIdentifier(String(payload.audienceId ?? '')))
    }
    if (headers.includes('audience_action')) {
      row.push(enquoteIdentifier(String(payload.audience_action ?? '')))
    }
    if (headers.includes('email')) {
      row.push(enquoteIdentifier(String(payload.email ?? '')))
    }
    if (headers.includes('userId')) {
      row.push(enquoteIdentifier(String(payload.userId ?? '')))
    }
    if (headers.includes('email')) {
      row.push(enquoteIdentifier(String(payload.email ?? '')))
    }
    if (headers.includes('anonymousId')) {
      row.push(enquoteIdentifier(String(payload.anonymousId ?? '')))
    }
    if (headers.includes('messageId')) {
      row.push(enquoteIdentifier(String(payload.messageId ?? '')))
    }
    if (headers.includes('space_id')) {
      row.push(enquoteIdentifier(String(payload.spaceId ?? '')))
    }
    if (headers.includes('integrations_object')) {
      row.push(enquoteIdentifier(String(payload.integrationsObject ?? '')))
    }
    if (headers.includes('properties_or_traits')) {
      row.push(enquoteIdentifier(String(payload.propertiesOrTraits ?? '')))
    }
    rows.push(row)
    console.log(row)
  })

  console.log(rows)

  // // Using a Set to keep track of headers
  // let headers = new Set<string>()
  // let rows = Buffer.from('')

  // Prepare data rows
  // for (let i = 0; i < payloads.length; i++) {
  //   const payload = payloads[i]
  //   headers = new Set<string>()

  //   // Process identifier_data
  //   if (payload.data) {
  //     for (const key in payload.data) {
  //       if (Object.prototype.hasOwnProperty.call(payload.data, key) && !headers.has(key)) {
  //         headers.add(key)
  //         row.push(enquoteIdentifier(String(payload.data[key])))
  //       }
  //     }
  //   }

  //   rows = Buffer.concat([rows, Buffer.from(row.join(settings.delimiter) + (i + 1 === payloads.length ? '' : '\n'))])
  // }

  // Add headers to the beginning of the file contents
  // rows = Buffer.concat([Buffer.from(Array.from(headers).join(settings.delimiter) + '\n'), rows])

  return { filename: audienceSettings?.filename, fileContents: rows }
}

function enquoteIdentifier(identifier: string) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

export { generateFile, enquoteIdentifier }
