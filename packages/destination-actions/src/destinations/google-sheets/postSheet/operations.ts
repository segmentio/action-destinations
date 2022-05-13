import { ExecuteInput, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AuthTokens } from '../../../../../core/src/destination-kit/parse-settings'

// TODO: Remove dependencies
import { google, sheets_v4 } from 'googleapis'
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
  sheets: sheets_v4.Sheets,
  payload: Payload,
  access_token: string,
  updateBatch: { identifier: string; event: { [k: string]: string }; targetIndex: number }[]
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

  sheets.spreadsheets.values
    .batchUpdate({
      spreadsheetId: payload.spreadsheet_id,
      access_token,
      requestBody: {
        valueInputOption: payload.data_format,
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

function processAppendBatch(
  sheets: sheets_v4.Sheets,
  payload: Payload,
  access_token: string,
  appendBatch: { identifier: string; event: { [k: string]: string } }[]
) {
  if (appendBatch.length <= 0) {
    return
  }

  const columns = Object.getOwnPropertyNames(payload.fields)

  sheets.spreadsheets.values
    .append({
      spreadsheetId: payload.spreadsheet_id,
      range: `${payload.spreadsheet_name}!A2`,
      valueInputOption: payload.data_format,
      access_token,
      requestBody: {
        values: appendBatch.map(({ identifier, event }) => generateColumnValuesFromFields(identifier, event, columns))
      }
    })
    .then(() => {
      console.log('append')
    })
    .catch((error) => {
      console.log(error)
    })
}

function processData(auth: AuthTokens | undefined, payload: Payload, data: ExecuteInput<Settings, Payload>) {
  if (!auth || !auth.accessToken) throw new IntegrationError('Missing OAuth information')

  const sheets = google.sheets({
    version: 'v4'
  })
  sheets.spreadsheets.values
    .get({
      spreadsheetId: payload.spreadsheet_id,
      range: `${payload.spreadsheet_name}!A:A`,
      access_token: auth.accessToken
    })
    .then((response) => {
      const getIdentifierFromData = (data: any) => {
        if (!data.rawData.__segment_id) throw new IntegrationError('Only Reverse ETL sources are supported', '400')
        return data.rawData.__segment_id
      }

      const eventMap = new Map() // TODO: Fix this for batchPerform
      eventMap.set(getIdentifierFromData(data), payload.fields)
      const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, eventMap)

      processUpdateBatch(sheets, payload, auth.accessToken, updateBatch)
      processAppendBatch(sheets, payload, auth.accessToken, appendBatch)
    })
    .catch((error) => {
      console.log(error)
    })
}

export { processData }
