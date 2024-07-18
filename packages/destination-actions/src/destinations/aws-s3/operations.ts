import { ExecuteInput } from '@segment/actions-core'
import type { Payload } from './syncAudienceToCSV/generated-types'
import type { AudienceSettings } from './generated-types'

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

function generateFile(payloads: Payload[], audienceSettings: AudienceSettings): string {
  const headers: string[] = []
  const columnsField = payloads[0].columns
  const additionalColumns = payloads[0].additional_identifiers_and_traits_columns ?? []

  Object.entries(columnsField).forEach(([_, value]) => {
    if (value !== undefined) {
      headers.push(value)
    }
  })

  additionalColumns.forEach((additionalColumn) => {
    headers.push(additionalColumn.value)
  })

  const headerString = `${headers.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}\n`

  const rows: string[] = [headerString]

  payloads.forEach((payload, index, arr) => {
    const action = payload.propertiesOrTraits[payload.audienceName]

    const row: string[] = []
    if (headers.includes('audience_name')) {
      row.push(enquoteIdentifier(String(payload.audienceName ?? '')))
    }
    if (headers.includes('audience_id')) {
      row.push(enquoteIdentifier(String(payload.audienceId ?? '')))
    }
    if (headers.includes('audience_action')) {
      row.push(enquoteIdentifier(String(action ?? '')))
    }
    if (headers.includes('email')) {
      row.push(enquoteIdentifier(String(payload.email ?? '')))
    }
    if (headers.includes('user_id')) {
      row.push(enquoteIdentifier(String(payload.userId ?? '')))
    }
    if (headers.includes('anonymous_id')) {
      row.push(enquoteIdentifier(String(payload.anonymousId ?? '')))
    }
    if (headers.includes('timestamp')) {
      row.push(enquoteIdentifier(String(payload.timestamp ?? '')))
    }
    if (headers.includes('message_id')) {
      row.push(enquoteIdentifier(String(payload.messageId ?? '')))
    }
    if (headers.includes('space_id')) {
      row.push(enquoteIdentifier(String(payload.spaceId ?? '')))
    }
    if (headers.includes('integrations_object')) {
      row.push(enquoteIdentifier(String(JSON.stringify(payload.integrationsObject) ?? '')))
    }
    if (headers.includes('properties_or_traits')) {
      row.push(enquoteIdentifier(String(JSON.stringify(payload.propertiesOrTraits) ?? '')))
    }

    additionalColumns.forEach((additionalColumn) => {
      //row.push(enquoteIdentifier(String(JSON.stringify(payload.propertiesOrTraits[additionalColumn.key]) ?? '')))
      row.push(enquoteIdentifier(String(JSON.stringify(additionalColumn.key) ?? '')))
    })

    const isLastRow = arr.length === index + 1
    const rowString = `${row.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}${
      isLastRow ? '' : '\n'
    }`

    rows.push(rowString)
  })

  return rows.join('')
}

function enquoteIdentifier(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

export { generateFile, enquoteIdentifier }
