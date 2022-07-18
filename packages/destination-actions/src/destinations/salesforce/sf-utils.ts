import { IntegrationError } from '@segment/actions-core'
import { GenericPayload } from './sf-types'
import camelCase from 'lodash/camelCase'

const isSettingsKey = new Set<string>([
  'operation',
  'traits',
  'enable_batching',
  'customFields',
  'bulkUpsertExternalId',
  'bulkUpdateRecordId'
])

const NO_VALUE = `#N/A`

const validateHeaderField = (field: string): void => {
  if (field.includes(',')) {
    throw new IntegrationError(
      `Invalid character in field name: ${field}`,
      `Invalid character in field name: ${field}`,
      400
    )
  }
}

/**
 * Iterates over each payload in the batch, and creates a map which represents each column in the CSV file.
 *
 * @param payloads Each payload in the batch.
 * @returns A map of header names to an array of (value, index) pairs. This map is essentially a
 * map of each column in the CSV file. The index is the index of the payload in the batch and is used
 * to maintain ordering when the CSV is generated.
 */
const buildHeaderMap = (payloads: GenericPayload[]): Map<string, [[string, number]]> => {
  const headerMap = new Map<string, [[string, number]]>()

  //iterate in reverse over payloads to use each headerMap array as a queue.
  for (let i = payloads.length - 1; i >= 0; i--) {
    const payload = payloads[i]
    Object.entries(payload).forEach(([key, value]) => {
      if (!isSettingsKey.has(key)) {
        const pascalKey = snakeCaseToPascalCase(key)
        const actualValue = value as string
        if (headerMap.has(pascalKey)) {
          headerMap.get(pascalKey)?.push([actualValue, i])
        } else {
          headerMap.set(pascalKey, [[actualValue, i]])
        }
      }
      if (key === 'customFields') {
        const customFields = value as object
        Object.entries(customFields).forEach(([customFieldName, customFieldValue]) => {
          validateHeaderField(customFieldName)

          if (!headerMap.has(customFieldName)) {
            headerMap.set(customFieldName, [[customFieldValue, i]])
          } else {
            headerMap.get(customFieldName)?.push([customFieldValue, i])
          }
        })
      }
    })
  }

  return headerMap
}

/**
 * Builds the first row of the CSV file, which is the header row.
 *
 * @param headerMap A map representing each column in the CSV file.
 * @returns The first row of the CSV file, which contains the header names.
 */
const buildHeaders = (headerMap: Map<string, [[string, number]]>): string => {
  let headers = ''
  for (const [key, _] of headerMap.entries()) {
    headers += `${key},`
  }
  return headers
}

/**
 * Iterates over each row in the CSV file. Each row is constructed by iterating over each column
 * represented in headerMap. If the value in the column applies to the row being constructed, it is
 * popped from the queue and added to the row. If not, #N/A is appended to the row.
 * The unique ID is then appended to the end of each row.
 *
 * @param payloads Each payload in the batch.
 * @param headerMap Represents each column in the CSV file.
 * @param n The size of the batch.
 * @returns The data rows of the CSV file.
 */
const buildCSVFromHeaderMap = (
  payloads: GenericPayload[],
  headerMap: Map<string, [[string, number]]>,
  n: number
): string => {
  let rows = ''

  for (let i = 0; i < n; i++) {
    let row = ''
    for (const [key, _] of headerMap.entries()) {
      let noValueFound = true
      if (headerMap.has(key)) {
        const column = headerMap.get(key) as [[string, number]]

        if (column !== undefined && column.length > 0 && column[column.length - 1][1] === i) {
          const value = column.pop()
          if (value !== undefined) {
            row += `"${value[0]}",`
            noValueFound = false
          }
        }
      }

      if (noValueFound) {
        row += `${NO_VALUE},`
      }
    }

    const uniqueIdValue = getUniqueIdValue(payloads[i])
    rows += `${row}"${uniqueIdValue}"\n`
  }
  return rows
}

const getUniqueIdValue = (payload: GenericPayload): string => {
  if (
    payload.enable_batching &&
    payload.operation === 'upsert' &&
    payload.bulkUpsertExternalId &&
    payload.bulkUpsertExternalId.externalIdValue
  ) {
    return payload.bulkUpsertExternalId.externalIdValue
  }

  if (payload.enable_batching && payload.operation === 'update' && payload.bulkUpdateRecordId) {
    return payload.bulkUpdateRecordId
  }

  throw new IntegrationError(
    `bulk ${payload.operation} is missing the required bulk ID`,
    `bulk ${payload.operation} is missing the required bulk ID`,
    400
  )
}

/**
 *
 * @param payloads Each payload in the batch.
 * @param uniqueIdName The name of the field that contains the external ID, or 'Id' when being used for bulk update.
 * @returns The complete CSV to send to Salesforce.
 */
export const buildCSVData = (payloads: GenericPayload[], uniqueIdName: string): string => {
  const headerMap = buildHeaderMap(payloads)
  let csv = buildHeaders(headerMap)

  csv += `${uniqueIdName}\n` + buildCSVFromHeaderMap(payloads, headerMap, payloads.length)

  return csv
}

// Our key names are in snake case, but Salesforce's field names are in Pascal case.
// I.E. 'last_name' is our key, but 'LastName' is the Salesforce field name.
const snakeCaseToPascalCase = (key: string): string => {
  const token = camelCase(key)
  return token.charAt(0).toUpperCase() + token.slice(1)
}
