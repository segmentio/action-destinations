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
    if (![undefined, null, ''].includes(value)) {
      headers.push(value)
    }
  })

  additionalColumns.forEach((additionalColumn) => {
    if (![undefined, null, ''].includes(additionalColumn.value)) {
      headers.push(additionalColumn.value)
    }
  })

  const headerString = `${headers.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}\n`
  const rows: string[] = [headerString]

  payloads.forEach((payload, index, arr) => {
    const action = payload.propertiesOrTraits[payload.audienceName]

    const row: string[] = []
    if (![undefined, null, ''].includes(columnsField.audience_name)) {
      row.push(encodeString(String(payload.audienceName ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.audience_id)) {
      row.push(encodeString(String(payload.audienceId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.audience_action)) {
      row.push(encodeString(String(action ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.email)) {
      row.push(encodeString(String(payload.email ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.user_id)) {
      row.push(encodeString(String(payload.userId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.anonymous_id)) {
      row.push(encodeString(String(payload.anonymousId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.timestamp)) {
      row.push(encodeString(String(payload.timestamp ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.message_id)) {
      row.push(encodeString(String(payload.messageId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.space_id)) {
      row.push(encodeString(String(payload.spaceId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.integrations_object)) {
      row.push(encodeString(String(JSON.stringify(payload.integrationsObject) ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.properties_or_traits)) {
      row.push(encodeString(String(JSON.stringify(payload.propertiesOrTraits) ?? '')))
    }

    additionalColumns.forEach((additionalColumn) => {
      row.push(encodeString(String(JSON.stringify(payload.propertiesOrTraits[additionalColumn.key]) ?? '')))
    })

    const isLastRow = arr.length === index + 1
    const rowString = `${row.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}${
      isLastRow ? '' : '\n'
    }`

    rows.push(rowString)
  })

  return rows.join('')
}

function encodeString(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

function validate(payloads: Payload[], audienceSettings: AudienceSettings) {
  const delimiter = audienceSettings.delimiter
  const columns = payloads[0].columns
  const additionalIdentifierColumns = payloads[0].additional_identifiers_and_traits_columns

  // ensure column names do not contain delimiter
  Object.values(columns).forEach((columnName) => {
    if (columnName.includes(delimiter)) {
      throw new Error(`Column name ${columnName} cannot contain delimiter: ${delimiter}`)
    }
  })

  // ensure additional identifier column names do not contain delimiter
  additionalIdentifierColumns?.forEach((column) => {
    if (column.value.includes(delimiter)) {
      throw new Error(`Column name ${column.value} cannot contain delimiter: ${delimiter}`)
    }
  })
}

export { generateFile, validate }
