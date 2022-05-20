import type { Payload } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import GoogleSheets from '../googleapis/index'

// TODO (STRATCONN-1379): Fork @flighter/a1-notation into @segment/a1-notation and add test cases
import A1 from '@flighter/a1-notation'

type Fields = {
  [k: string]: string
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
function processGetSpreadsheetResponse(response: any, events: Payload[]) {
  // TODO (STRATCONN-1375): Fail request if above row limit

  const updateBatch: { identifier: string; event: Fields; targetIndex: number }[] = []
  const appendBatch: { identifier: string; event: Fields }[] = []

  // Use a hashmap to efficiently find if the event already exists in the spreadsheet (update) or not (append).
  const eventMap = new Map(events.map((e) => [e.record_identifier, e.fields]))

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

  eventMap.forEach((value, key) => {
    appendBatch.push({
      identifier: key,
      event: value as Fields
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
  sheets: sheets_v4.Sheets,
  mappingSettings: MappingSettings,
  updateBatch: { identifier: string; event: { [k: string]: string }; targetIndex: number }[],
  gs: GoogleSheets
) {
  // Utility function used to calculate which range an event should be written to
  const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
    const targetRange = new A1(startColumn, targetIndex + startRow)
    targetRange.addX(columnCount)
    return targetRange.toString()
  }

  const batchPayload = updateBatch.map(({ identifier, event, targetIndex }) => {
    // Flatten event fields to be just the values
    const values = generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
    return {
      range: `${mappingSettings.spreadsheetName}!${getRange(targetIndex, values.length)}`,
      values: [values]
    }
  })

  // Always add to the payload a write to the first row (containing column names) in case that columns have been updated
  const headerRowRange = new A1(1, 1, 1, mappingSettings.columns.length + 1)
  batchPayload.push({
    range: `${mappingSettings.spreadsheetName}!${headerRowRange.toString()}`,
    values: [['id', ...mappingSettings.columns]]
  })

  sheets.spreadsheets.values
    .batchUpdate({
      spreadsheetId: mappingSettings.spreadsheetId,
      access_token,
      requestBody: {
        valueInputOption: mappingSettings.dataFormat,
        data: batchPayload
      }
    })
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
  sheets: sheets_v4.Sheets,
  mappingSettings: MappingSettings,
  appendBatch: { identifier: string; event: { [k: string]: string } }[],
  gs: GoogleSheets
) {
  if (appendBatch.length <= 0) {
    return
  }

  // Flatten event fields to be just the values
  const values = appendBatch.map(({ identifier, event }) =>
    generateColumnValuesFromFields(identifier, event, mappingSettings.columns)
  )

  // Start from A2 to skip header row (in case it has not been written yet)
  gs.append(mappingSettings, 'A2', values)
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
 * @param events array of events to commit to the spreadsheet
 */
function processData(request: RequestClient, events: Payload[]) {
  // These are assumed to be constant across all events
  const mappingSettings = {
    spreadsheetId: events[0].spreadsheet_id,
    spreadsheetName: events[0].spreadsheet_name,
    dataFormat: events[0].data_format,
    columns: Object.getOwnPropertyNames(events[0].fields)
  }

  const gs: GoogleSheets = new GoogleSheets(request)

  // Get all of the row identifiers (assumed to be in the first column A)
  gs.get(mappingSettings, 'A:A')
    .then((response) => {
      // TODO (STRATCONN-1380): Support delete operation
      // Use the retrieved row identifiers along with the incoming events to decide which ones should be appended or updated.
      const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, events)

      processUpdateBatch(mappingSettings, updateBatch, gs)
      processAppendBatch(mappingSettings, appendBatch, gs)
    })
    .catch((error) => {
      console.log(error)
    })
}

export { processData }
