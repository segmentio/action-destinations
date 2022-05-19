import type { Payload } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import GoogleSheets from '../googleapis/index'

// TODO (STRATCONN-1379): Fork @flighter/a1-notation into @segment/a1-notation and add test cases
import A1 from '@flighter/a1-notation'

type Fields = {
  [k: string]: string
}

/**
 * Union of mapping data (payload) and dependencies taken on the source type
 */
type PayloadEvent = {
  identifier: string
  operation: string
  payload: Payload
}

/**
 * Invariant settings that are common to all events in the payload.
 */
export type MappingSettings = {
  spreadsheetId: string
  spreadsheetName: string
  dataFormat: string
  columns: string[]
}

/**
 * Utility function that converts the event properties into an array of strings that Google Sheets API can understand.
 * Note that the identifier is forced as the first column.
 * @param identifier value used to imbue fields with a uniqueness constraint
 * @param fields list of properties contained in the event
 * @param columns list of properties that will be committed to the spreadsheet
 * @returns a string object that has used the `fields` data to populate the `columns` ordering
 */
const generateColumnValuesFromFields = (identifier: string, fields: Fields, columns: string[]) => {
  const retVal = columns.map((col) => fields[col] ?? '')
  retVal.unshift(identifier) // Write identifier as first column
  return retVal
}

/**
 * Processes the response of the Google Sheets GET call and parses the events into an update and a append bucket.
 * @param response result of the Google Sheets API get call
 * @param eventMap hashmap linking columns to be written to the identifier of the row
 * @returns
 */
function processGetSpreadsheetResponse(response: any, eventMap: Map<string, Fields>) {
  // TODO (STRATCONN-1375): Fail request if above row limit

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

/**
 * Commits all passed events to the correct row in the spreadsheet, as well as the columns header row.
 * @param mappingSettings configuration object detailing parameters for the call
 * @param updateBatch array of events to commit to the spreadsheet
 * @param gs interface object capable of interacting with Google Sheets API
 */
function processUpdateBatch(
  mappingSettings: MappingSettings,
  updateBatch: { identifier: string; event: { [k: string]: string }; targetIndex: number }[],
  gs: GoogleSheets
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

  gs.batchUpdate(mappingSettings, batchPayload)
    .then(() => {
      console.log('update')
    })
    .catch((error) => {
      console.log(error)
    })
}

/**
 * Commits all passed events to the bottom of the spreadsheet.
 * @param mappingSettings configuration object detailing parameters for the call
 * @param appendBatch array of events to commit to the spreadsheet
 * @param gs interface object capable of interacting with Google Sheets API
 * @returns
 */
function processAppendBatch(
  mappingSettings: MappingSettings,
  appendBatch: { identifier: string; event: { [k: string]: string } }[],
  gs: GoogleSheets
) {
  if (appendBatch.length <= 0) {
    return
  }

  const values = appendBatch.map(({ identifier, event }) =>
    generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
  )

  gs.append(mappingSettings, values)
    .then(() => {
      console.log('append')
    })
    .catch((error) => {
      console.log(error)
    })
}

/**
 * Takes an array of events and dynamically decides whether to append, update or delete rows from the spreadsheet.
 * @param request request object used to perform HTTP calls
 * @param events array of events to commit
 */
function processData(request: RequestClient, events: PayloadEvent[]) {
  // These are assumed to be constant across all events
  const mappingSettings = {
    spreadsheetId: events[0].payload.spreadsheet_id,
    spreadsheetName: events[0].payload.spreadsheet_name,
    dataFormat: events[0].payload.data_format,
    columns: Object.getOwnPropertyNames(events[0].payload.fields)
  }

  const gs: GoogleSheets = new GoogleSheets(request)

  gs.get(mappingSettings)
    .then((response) => {
      const eventMap = new Map(events.map((e) => [e.identifier, e.payload.fields as Fields]))

      // TODO (STRATCONN-1380): Support delete operation
      const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, eventMap)

      processUpdateBatch(mappingSettings, updateBatch, gs)
      processAppendBatch(mappingSettings, appendBatch, gs)
    })
    .catch((error) => {
      console.log(error)
    })
}

export { processData }
