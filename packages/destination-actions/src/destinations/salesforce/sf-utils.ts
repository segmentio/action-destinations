import { IntegrationError } from '@segment/actions-core'
import { GenericPayload } from './sf-types'
// import camelCase from 'lodash/camelCase'

const isSettingsKey = new Set<string>(['operation', 'traits', 'customFields'])

const NO_VALUE = `#N/A`

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

const buildHeaderMap = (payloads: GenericPayload[]): Map<string, [[string, number]]> => {
  const headerMap = new Map<string, [[string, number]]>()

  //iterate in reverse over payloads
  for (let i = payloads.length - 1; i >= 0; i--) {
    const payload = payloads[i]
    Object.entries(payload).forEach(([key, value]) => {
      if (!isSettingsKey.has(key)) {
        const actualValue = value as string
        if (headerMap.has(key)) {
          headerMap.get(key)?.push([actualValue, i])
        } else {
          headerMap.set(key, [[actualValue, i]])
        }
      }
      if (key === 'customFields') {
        const customFields = value as object
        Object.entries(customFields).forEach(([customFieldName, customFieldValue]) => {
          const fieldErr = validateHeaderField(customFieldName)
          if (fieldErr) {
            throw fieldErr
          }

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

const buildHeaders = (headerMap: Map<string, [[string, number]]>): string => {
  let headers = ''
  for (const [key, _] of headerMap.entries()) {
    headers += `${key},`
  }
  return headers
}

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
    const externalIdFieldValue = payloads[i].traits?.externalIdFieldValue as string
    rows += `${row}"${externalIdFieldValue}"\n`
  }
  return rows
}

export const buildCSVData = (payloads: GenericPayload[], externalIdFieldName: string): string => {
  const headerMap = buildHeaderMap(payloads)
  let csv = buildHeaders(headerMap)
  console.log('csv', csv)

  csv += `${externalIdFieldName}\n` + buildCSVFromHeaderMap(payloads, headerMap, payloads.length)

  return csv
}

// Our key names are in snake case, but Salesforce's field names are in Pascal case.
// I.E. 'last_name' is our key, but 'LastName' is the Salesforce field name.
// const snakeCaseToPascalCase = (key: string): string => {
//   const token = camelCase(key)
//   return token.charAt(0).toUpperCase() + token.slice(1)
// }
