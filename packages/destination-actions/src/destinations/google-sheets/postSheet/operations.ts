import { IntegrationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import type { AuthTokens } from '../../../../../core/src/destination-kit/parse-settings'
import { RequestClient } from '@segment/actions-core'
import GoogleSheets from '../googleapis/index'

// TODO: Remove dependencies
import A1 from '@flighter/a1-notation'

type Fields = {
  [k: string]: string
}

type MappingSettings = {
  spreadsheetId: string
  spreadsheetName: string
  dataFormat: string
  columns: string[]
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
  mappingSettings: MappingSettings,
  updateBatch: { identifier: string; event: { [k: string]: string }; targetIndex: number }[],
  request: RequestClient
) {
  const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
    const targetRange = new A1(startColumn, targetIndex + startRow)
    targetRange.addX(columnCount)
    return targetRange.toString()
  }

  const batchPayload = updateBatch.map(({ identifier, event, targetIndex }) => {
    const values = generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
    return {
      range: `${mappingSettings.spreadsheetName}!${getRange(targetIndex, values.length)}`,
      values: [values]
    }
  })

  // Always write columns names on first row
  const headerRowRange = new A1(1, 1, 1, mappingSettings.columns.length + 1)
  batchPayload.push({
    range: `${mappingSettings.spreadsheetName}!${headerRowRange.toString()}`,
    values: [['id', ...mappingSettings.columns]]
  })
  const gs: GoogleSheets = new GoogleSheets(request)

  gs.batchUpdate(mappingSettings, batchPayload)
    .then(() => {
      console.log('update')
    })
    .catch((error) => {
      console.log(error)
    })
}

function processAppendBatch(
  mappingSettings: MappingSettings,
  appendBatch: { identifier: string; event: { [k: string]: string } }[],
  request: RequestClient
) {
  if (appendBatch.length <= 0) {
    return
  }

  const columns = Object.getOwnPropertyNames(mappingSettings.columns)
  const values = appendBatch.map(({ identifier, event }) => generateColumnValuesFromFields(identifier, event, columns))
  const gs: GoogleSheets = new GoogleSheets(request)

  gs.append(mappingSettings, values)
    .then(() => {
      console.log('append')
    })
    .catch((error) => {
      console.log(error)
    })
}
type PayloadEvent = {
  identifier: string
  payload: Payload
}
function processData(auth: AuthTokens | undefined, events: PayloadEvent[], request: RequestClient) {
  if (!auth || !auth.accessToken) throw new IntegrationError('Missing OAuth information')

  // These are assumed to be constant across all events
  const mappingSettings = {
    spreadsheetId: events[0].payload.spreadsheet_id,
    spreadsheetName: events[0].payload.spreadsheet_name,
    dataFormat: events[0].payload.data_format,
    columns: Object.getOwnPropertyNames(events[0].payload.fields)
  }

  const sheets = google.sheets({
    version: 'v4'
  })
  sheets.spreadsheets.values
    .get({
      spreadsheetId: mappingSettings.spreadsheetId,
      range: `${mappingSettings.spreadsheetName}!A:A`,
      access_token: auth.accessToken
    })
    .then((response) => {
      const eventMap = new Map()
      events.forEach((e) => {
        eventMap.set(e.identifier, e.payload.fields)
      })
      const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, eventMap)

      processUpdateBatch(mappingSettings, updateBatch, request)
      processAppendBatch(mappingSettings, appendBatch, request)
    })
    .catch((error) => {
      console.log(error)
    })
}

export { processData }
