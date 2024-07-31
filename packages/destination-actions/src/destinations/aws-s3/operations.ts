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

  const rows: string[] = []

  payloads.forEach((payload, index, arr) => {
    const action = payload.propertiesOrTraits[payload.audienceName]

    const row: string[] = []

    if (![undefined, null, ''].includes(columnsField.audience_name)) {
      if (index === 0) {
        headers.push(columnsField.audience_name as string)
      }
      row.push(encodeString(String(payload.audienceName ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.audience_id)) {
      if (index === 0) {
        headers.push(columnsField.audience_id as string)
      }
      row.push(encodeString(String(payload.audienceId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.audience_action)) {
      if (index === 0) {
        headers.push(columnsField.audience_action as string)
      }
      row.push(encodeString(String(action ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.email)) {
      if (index === 0) {
        headers.push(columnsField.email as string)
      }
      row.push(encodeString(String(payload.email ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.user_id)) {
      if (index === 0) {
        headers.push(columnsField.user_id as string)
      }
      row.push(encodeString(String(payload.userId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.anonymous_id)) {
      if (index === 0) {
        headers.push(columnsField.anonymous_id as string)
      }
      row.push(encodeString(String(payload.anonymousId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.timestamp)) {
      if (index === 0) {
        headers.push(columnsField.timestamp as string)
      }
      row.push(encodeString(String(payload.timestamp ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.message_id)) {
      if (index === 0) {
        headers.push(columnsField.message_id as string)
      }
      row.push(encodeString(String(payload.messageId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.space_id)) {
      if (index === 0) {
        headers.push(columnsField.space_id as string)
      }
      row.push(encodeString(String(payload.spaceId ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.integrations_object)) {
      if (index === 0) {
        headers.push(columnsField.integrations_object as string)
      }
      row.push(encodeString(String(JSON.stringify(payload.integrationsObject) ?? '')))
    }
    if (![undefined, null, ''].includes(columnsField.properties_or_traits)) {
      if (index === 0) {
        headers.push(columnsField.properties_or_traits as string)
      }
      row.push(encodeString(String(JSON.stringify(payload.propertiesOrTraits) ?? '')))
    }

    if (payload.additional_identifiers_and_traits_columns) {
      for (const [key, value] of Object.entries(payload.additional_identifiers_and_traits_columns)) {
        if (index === 0) {
          headers.push(String(value))
        }
        row.push(encodeString(String(payload.propertiesOrTraits[String(key)] ?? '')))
      }
    }

    const isLastRow = arr.length === index + 1
    const rowString = `${row.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}${
      isLastRow ? '' : '\n'
    }`

    if (index === 0) {
      const headerString = `${headers.join(audienceSettings.delimiter === 'tab' ? '\t' : audienceSettings.delimiter)}\n`
      rows.push(headerString)
    }
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
  // additionalIdentifierColumns?.forEach((column) => {
  //   if (column.value.includes(delimiter)) {
  //     throw new Error(`Column name ${column.value} cannot contain delimiter: ${delimiter}`)
  //   }
  // })

  // ensure additional identifier column names do not contain delimiter
  if (additionalIdentifierColumns) {
    Object.entries(additionalIdentifierColumns).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes(delimiter)) {
        throw new Error(`Column name ${key} cannot contain delimiter: ${delimiter}`)
      }
    })
  }
}

export { generateFile, validate }
