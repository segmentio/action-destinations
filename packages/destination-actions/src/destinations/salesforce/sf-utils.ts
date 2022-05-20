import { IntegrationError } from '@segment/actions-core'
import { GenericPayload } from './sf-types'
import camelCase from 'lodash/camelCase'

const isSettingsKey = new Set<string>(['operation', 'traits', 'customFields'])

const validateHeaderField = (field: string): IntegrationError | false => {
  if (field.includes(',')) {
    return new IntegrationError(
      `Invalid character in field name: ${field}`,
      `Invalid character in field name: ${field}`,
      400
    )
  }
  return false
}

export const buildCSVData = (payloads: GenericPayload[], externalIdFieldName: string): string => {
  let headers = buildHeader(payloads, externalIdFieldName) + '\n'

  payloads.forEach((payload) => {
    headers += buildRow(payload) + '\n'
  })

  return headers
}

const buildRow = (payload: GenericPayload): string => {
  let row = ''

  // Iterate over the keys in payload that map to a SF object field
  // Add each value to the row, separated by a comma
  // The last value in the row should be the externalIDField value.
  // All valid rows will include a value for the externalIDField,
  // it is included as the last value in the row for convenience.

  Object.entries(payload).forEach(([key, value]) => {
    if (!isSettingsKey.has(key)) {
      row += `"${value}",`
    }
    if (key === 'customFields') {
      const customFields = value as object
      Object.entries(customFields).forEach(([_, value]) => {
        row += `"${value}",`
      })
    }
  })
  row += `"${payload?.traits?.externalIdFieldValue}"`

  return row
}

const buildHeader = (payloads: GenericPayload[], externalIdFieldName: string): string => {
  const err = validateHeaderField(externalIdFieldName)
  if (err) {
    throw err
  }

  let header = ''
  Object.keys(payloads[0]).forEach((key) => {
    if (!isSettingsKey.has(key)) {
      header += `"${snakeCaseToPascalCase(key)}",`
    }
    if (key === 'customFields') {
      const customFields = payloads[0].customFields as object
      Object.keys(customFields).forEach((customFieldName) => {
        const fieldErr = validateHeaderField(customFieldName)
        if (fieldErr) {
          throw fieldErr
        }

        header += `"${customFieldName}",`
      })
    }
  })
  header += `"${externalIdFieldName}"`

  return header
}

// Our key names are in snake case, but Salesforce's field names are in Pascal case.
// I.E. 'last_name' is our key, but 'LastName' is the Salesforce field name.
const snakeCaseToPascalCase = (key: string): string => {
  const token = camelCase(key)
  return token.charAt(0).toUpperCase() + token.slice(1)
}
