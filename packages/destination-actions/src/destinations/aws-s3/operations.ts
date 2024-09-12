import { ExecuteInput } from '@segment/actions-core'
import type { Payload } from './uploadCsvConnections/generated-types'

// Type definitions
export type RawData = {
  context?: {
    personas?: {
      computation_key?: string
      computation_class?: string
      computation_id?: string
      space_id?: string
    }
  }
}
// Combine RawData with the existing Payload type
export type PayloadWithRawData = Payload & RawData
export type ExecuteInputRaw<Settings, Payload, RawData> = ExecuteInput<Settings, Payload> & { rawData?: RawData }

function generateFile(payloads: PayloadWithRawData[], isAudience?: boolean): string {
  const headers: string[] = []
  const columnsField = payloads[0].columns

  const rows: string[] = []

  payloads.forEach((payload, index, arr) => {
    const row: string[] = []

    if (isAudience) {
      if (index === 0) {
        headers.push('audience_name', 'audience_id', 'audience_class', 'space_id', 'audience_action')
      }
      row.push(
        encodeString(String(payload.context?.personas?.computation_key ?? '')),
        encodeString(String(payload.context?.personas?.computation_id ?? '')),
        encodeString(String(payload.context?.personas?.computation_class ?? '')),
        encodeString(String(payload.context?.personas?.space_id ?? '')),
        encodeString(String(payload.user_traits?.[String(payload.context?.personas?.computation_key ?? '')] ?? ''))
      )
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
    if (![undefined, null, ''].includes(columnsField.integrations_object)) {
      if (index === 0) {
        headers.push(columnsField.integrations_object as string)
      }
      row.push(encodeString(String(JSON.stringify(payload.integrationsObject) ?? '')))
    }
    // if (![undefined, null, ''].includes(columnsField.properties_or_traits)) {
    //   if (index === 0) {
    //     headers.push(columnsField.properties_or_traits as string)
    //   }
    //   row.push(encodeString(String(JSON.stringify(payload.propertiesOrTraits) ?? '')))
    // }

    if (![undefined, null, ''].includes(columnsField.eventName)) {
      if (index === 0) {
        headers.push(columnsField.eventName as string)
      }
      row.push(encodeString(String(payload.eventName ?? '')))
    }

    if (![undefined, null, ''].includes(columnsField.eventType)) {
      if (index === 0) {
        headers.push(columnsField.eventType as string)
      }
      row.push(encodeString(String(payload.eventType ?? '')))
    }

    if (payload.eventProperties) {
      for (const [key, value] of Object.entries(payload.eventProperties)) {
        if (index === 0) {
          headers.push(String(key))
        }
        row.push(encodeString(String(value)))
        // row.push(encodeString(String(payload.eventProperties[String(key)] ?? '')))
      }
    }

    if (payload.userTraits) {
      for (const [key, value] of Object.entries(payload.userTraits)) {
        if (index === 0) {
          headers.push(String(key))
        }
        row.push(encodeString(String(value)))
        // row.push(encodeString(String(payload.userTraits[String(value)] ?? '')))
      }
    }

    const isLastRow = arr.length === index + 1
    const rowString = `${row.join(payload.delimiter === 'tab' ? '\t' : payload.delimiter)}${isLastRow ? '' : '\n'}`

    if (index === 0) {
      const headerString = `${headers.join(payload.delimiter === 'tab' ? '\t' : payload.delimiter)}\n`
      rows.push(headerString)
    }
    rows.push(rowString)
  })
  return rows.join('')
}

function encodeString(str: string) {
  return `"${String(str).replace(/"/g, '""')}"`
}

function validate(payloads: Payload[]) {
  const delimiter = payloads[0].delimiter
  const columns = payloads[0].columns
  const additionalPropertiesColumns = payloads[0].eventProperties
  const additionalTraitsColumns = payloads[0].userTraits

  // ensure column names do not contain delimiter
  Object.values(columns).forEach((columnName) => {
    if (columnName.includes(delimiter)) {
      throw new Error(`Column name ${columnName} cannot contain delimiter: ${delimiter}`)
    }
  })

  // ensure additional identifier column names do not contain delimiter
  if (additionalPropertiesColumns) {
    Object.entries(additionalPropertiesColumns).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes(delimiter)) {
        throw new Error(`Column name ${key} cannot contain delimiter: ${delimiter}`)
      }
    })
  }
  if (additionalTraitsColumns) {
    Object.entries(additionalTraitsColumns).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes(delimiter)) {
        throw new Error(`Column name ${key} cannot contain delimiter: ${delimiter}`)
      }
    })
  }
}

export { generateFile, validate }
