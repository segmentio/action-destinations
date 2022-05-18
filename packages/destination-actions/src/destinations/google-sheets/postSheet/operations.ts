import { ExecuteInput, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AuthTokens } from '../../../../../core/src/destination-kit/parse-settings'
import { RequestClient } from '@segment/actions-core'
import GoogleSheets from '../googleapis/index'

// TODO: Remove dependencies
import A1 from '@flighter/a1-notation'

type Fields = {
  [k: string]: string
}

const generateColumnValuesFromFields = (identifier: string, fields: Fields, columns: string[]) => {
  const retVal = columns.map((col) => fields[col] ?? '')
  retVal.unshift(identifier) // Write identifier as first column
  return retVal
}

function processGetSpreadsheetResponse(response: any, eventMap: Map<string, Fields>) {
  // TODO: Fail request if above row limit

  const updateBatch: { identifier: string; event: Fields; targetIndex: number }[] = []
  if (response.data.values && response.data.values.length > 0) {
    for (let i = 1; i < response.data.values.length; i++) {
      const targetIdentifier = response.data.values[i][0]
      if (eventMap.has(targetIdentifier)) {
        updateBatch.push({
          identifier: targetIdentifier,
          event: eventMap.get(targetIdentifier) as Fields,
          targetIndex: i
        })
        eventMap.delete(targetIdentifier)
      }
    }
  }

  const appendBatch: { identifier: string; event: Fields }[] = []
  eventMap.forEach((value, key) => {
    appendBatch.push({
      identifier: key,
      event: value
    })
  })

  return { appendBatch, updateBatch }
}

function processUpdateBatch(
  payload: Payload,
  updateBatch: { identifier: string; event: { [k: string]: string }; targetIndex: number }[],
  request: RequestClient
) {
  const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
    const targetRange = new A1(startColumn, targetIndex + startRow)
    targetRange.addX(columnCount)
    return targetRange.toString()
  }

  const columns = Object.getOwnPropertyNames(payload.fields)

  const batchPayload = updateBatch.map(({ identifier, event, targetIndex }) => {
    const values = generateColumnValuesFromFields(identifier, event, columns)
    return {
      range: `${payload.spreadsheet_name}!${getRange(targetIndex, values.length)}`,
      values: [values]
    }
  })

  // Always write columns names on first row
  const headerRowRange = new A1(1, 1, 1, columns.length + 1)
  batchPayload.push({
    range: `${payload.spreadsheet_name}!${headerRowRange.toString()}`,
    values: [['id', ...columns]]
  })
  const gs: GoogleSheets = new GoogleSheets(request)

  gs.batchUpdate(payload, batchPayload)
    .then(() => {
      console.log('update')
    })
    .catch((error) => {
      console.log(error)
    })
}

function processAppendBatch(
  payload: Payload,
  appendBatch: { identifier: string; event: { [k: string]: string } }[],
  request: RequestClient
) {
  if (appendBatch.length <= 0) {
    return
  }

  const columns = Object.getOwnPropertyNames(payload.fields)
  const values = appendBatch.map(({ identifier, event }) => generateColumnValuesFromFields(identifier, event, columns))
  const gs: GoogleSheets = new GoogleSheets(request)

  gs.append(payload, values)
    .then(() => {
      console.log('append')
    })
    .catch((error) => {
      console.log(error)
    })
}

function processData(
  auth: AuthTokens | undefined,
  payload: Payload,
  data: ExecuteInput<Settings, Payload>,
  request: RequestClient
) {
  if (!auth || !auth.accessToken) throw new IntegrationError('Missing OAuth information')

  const gs: GoogleSheets = new GoogleSheets(request)

  gs.get(payload)
    .then((response) => {
      const getIdentifierFromData = (data: any) => {
        if (!data.rawData.__segment_id) throw new IntegrationError('Only Reverse ETL sources are supported', '400')
        return data.rawData.__segment_id
      }

      const eventMap = new Map() // TODO: Fix this for batchPerform
      eventMap.set(getIdentifierFromData(data), payload.fields)
      const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, eventMap)

      processUpdateBatch(payload, updateBatch, request)
      processAppendBatch(payload, appendBatch, request)
    })
    .catch((error) => {
      console.log(error)
    })
}

export { processData }
