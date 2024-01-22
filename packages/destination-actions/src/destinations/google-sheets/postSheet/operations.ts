import type { Payload } from './generated-types'
import { IntegrationError, RequestClient, StatsContext } from '@segment/actions-core'
import { GoogleSheets, GetResponse } from '../googleapis/index'
import { CONSTANTS } from '../constants'

import A1 from '@segment/a1-notation'

type Fields = {
  [k: string]: string
}

interface Identifiable {
  identifier: string
}

interface Indexable {
  index: number
}

type UpdateBatch = Identifiable & Indexable & { event: Fields }
type AppendBatch = Identifiable & { event: Fields }

/**
 * Invariant settings that are common to all events in the payload.
 */
export type MappingSettings = {
  spreadsheetId: string
  spreadsheetName: string
  dataFormat: string
  columns: string[]
}

// The data in the spreadsheet begins in row 2, because it's assumed that the first row will contain the column names.
const DATA_ROW_OFFSET = 2

/**
 * Utility function that converts the event properties into an array of strings that Google Sheets API can understand.
 * Note that the identifier is forced as the first column. 
 * @param identifier value used to imbue fields with a uniqueness constraint
 * @param fields list of properties contained in the event
 * @param columns list of properties that will be committed to the spreadsheet
 * @returns a string object that has used the `fields` data to populate the `columns` ordering
 * 
 * @example
 * fields: 
    {
      "CLOSE_DATE": "2022-07-08T00:00:00Z",
      "CLOSE_DATE_EOQ": "2022-07-08",
      "ENTRY_POINT": "Website Demo Request",
      "E_ARR_POST_LAUNCH_C": "100000.0",
      "FINANCE_ENTRY_POINT": "Inbound High Intent"
    } 
    columns: ["ENTRY_POINT", "MISSING_COLUMN", "CLOSE_DATE"]

    return => ["Website Demo Request", "", "2022-07-08T00:00:00Z"]

 */
const generateColumnValuesFromFields = (identifier: string, fields: Fields, columns: string[]) => {
  const retVal = columns.map((col) => fields[col] ?? '')
  retVal.unshift(identifier) // Write identifier as first column
  return retVal
}

/**
 * Processes the response of the Google Sheets GET call and parses the events into separate operation buckets.
 * @param response result of the Google Sheets API get call
 * @param events data to be written to the spreadsheet
 * @returns
 */
function processGetSpreadsheetResponse(response: GetResponse, events: Payload[], mappingSettings: MappingSettings) {
  const numColumns = mappingSettings.columns.length
  const numRows = response.values?.length

  if (numRows * numColumns > CONSTANTS.MAX_CELLS) {
    throw new IntegrationError('Sheet has reached maximum limit', 'INVALID_REQUEST_DATA', 400)
  }

  const updateBatch: UpdateBatch[] = []
  const appendBatch: AppendBatch[] = []

  // Use a hashmap to efficiently find if the event already exists in the spreadsheet (update) or not (append).
  const eventMap = new Map(events.map((e) => [e.record_identifier, e]))

  if (response.values && response.values.length > 0) {
    for (let i = 0; i < response.values.length; i++) {
      const targetIdentifier = response.values[i][0]
      if (eventMap.has(targetIdentifier)) {
        // The event being processed already exists in the spreadsheet.
        const targetEvent = eventMap.get(targetIdentifier) as Payload
        if (targetEvent.operation_type != 'deleted') {
          updateBatch.push({
            identifier: targetIdentifier,
            event: targetEvent.fields as Fields,
            index: i
          })
        }
        eventMap.delete(targetIdentifier)
      }
    }
  }

  // At this point, eventMap contains all the rows we couldn't find in the spreadsheet.
  eventMap.forEach((value, key) => {
    // If delete, just drop event
    if (value.operation_type != 'deleted') {
      appendBatch.push({
        identifier: key,
        event: value.fields as Fields
      })
    }
  })

  return { appendBatch, updateBatch }
}

/**
 * Commits all passed events to the correct row in the spreadsheet, as well as the columns header row.
 * @param mappingSettings configuration object detailing parameters for the call
 * @param updateBatch array of events to commit to the spreadsheet
 * @param gs interface object capable of interacting with Google Sheets API
 */
async function processUpdateBatch(
  mappingSettings: MappingSettings,
  updateBatch: UpdateBatch[],
  gs: GoogleSheets,
  statsContext: StatsContext | undefined
) {
  // Utility function used to calculate which range an event should be written to
  const getRange = (targetIndex: number, columnCount: number) => {
    const targetRange = new A1(1, targetIndex)
    targetRange.addX(columnCount)
    return targetRange.toString()
  }

  const batchPayload = updateBatch.map(({ identifier, event, index }) => {
    // Flatten event fields to be just the values
    const values = generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
    return {
      range: `${mappingSettings.spreadsheetName}!${getRange(index + DATA_ROW_OFFSET, values.length)}`,
      values: [values]
    }
  })

  // Always add to the payload a write to the first row (containing column names) in case that columns have been updated
  const headerRowRange = new A1(1, 1, 1, mappingSettings.columns.length + 1)
  batchPayload.push({
    range: `${mappingSettings.spreadsheetName}!${headerRowRange.toString()}`,
    values: [['id', ...mappingSettings.columns]]
  })
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:batchUpdate`])
  return gs.batchUpdate(mappingSettings, batchPayload)
}

// TODO: Re-enable delete once locking is supported.
/**
 * Clears all passed events from the spreadsheet.
 * @param mappingSettings configuration object detailing parameters for the call
 * @param updateBatch array of events to clear from the spreadsheet
 * @param gs interface object capable of interacting with Google Sheets API
 */
// async function processDeleteBatch(
//   mappingSettings: MappingSettings,
//   deleteBatch: { identifier: string; targetIndex: number }[],
//   gs: GoogleSheets
// ) {
//   if (deleteBatch.length <= 0) {
//     return
//   }

//   // TODO: fix a1-notation package to support 1:1 notation
//   const deletePayload = deleteBatch.map(({ targetIndex }) => {
//     return {
//       range: `${mappingSettings.spreadsheetName}!${targetIndex}:${targetIndex}`
//     }
//   })

//   return gs
//     .batchClear(mappingSettings, deletePayload)
//     .then(() => {
//       console.log('delete')
//     })
//     .catch((error) => {
//       console.log(error)
//     })
// }

/**
 * Commits all passed events to the bottom of the spreadsheet.
 * @param mappingSettings configuration object detailing parameters for the call
 * @param appendBatch array of events to commit to the spreadsheet
 * @param gs interface object capable of interacting with Google Sheets API
 * @returns
 */
async function processAppendBatch(
  mappingSettings: MappingSettings,
  appendBatch: AppendBatch[],
  gs: GoogleSheets,
  statsContext: StatsContext | undefined
) {
  if (appendBatch.length <= 0) {
    return
  }

  // Flatten event fields to be just the values
  const values = appendBatch.map(({ identifier, event }) =>
    generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
  )
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:append-spreadsheet`])
  return gs.append(mappingSettings, `A${DATA_ROW_OFFSET}`, values)
}

/**
 * Takes an array of events and dynamically decides whether to append, update or delete rows from the spreadsheet.
 * @param request request object used to perform HTTP calls
 * @param events array of events to commit to the spreadsheet
 */
async function processData(request: RequestClient, events: Payload[], statsContext: StatsContext | undefined) {
  // These are assumed to be constant across all events
  const mappingSettings = {
    spreadsheetId: events[0].spreadsheet_id,
    spreadsheetName: events[0].spreadsheet_name,
    dataFormat: events[0].data_format,
    columns: Object.getOwnPropertyNames(events[0].fields)
  }

  const gs: GoogleSheets = new GoogleSheets(request)
  statsContext?.statsClient?.incr('oauth_app_api_call', 1, [...statsContext?.tags, `endpoint:get-spreadsheet`])
  // Get all of the row identifiers (assumed to be in the first column A)
  const response = await gs.get(mappingSettings, `A${DATA_ROW_OFFSET}:A`)

  // Use the retrieved row identifiers along with the incoming events to decide which ones should be appended or updated.
  const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response.data, events, mappingSettings)

  const promises = [
    processUpdateBatch(mappingSettings, updateBatch, gs, statsContext),
    processAppendBatch(mappingSettings, appendBatch, gs, statsContext)
  ]

  return await Promise.all(promises)
}

export { processData }
