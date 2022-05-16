import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { processGetSpreadsheetResponse } from './operations'

// TODO: Remove dependencies
import { google } from 'googleapis'
import A1 from '@flighter/a1-notation'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Sheet',
  description: 'Write values to a Google Sheets spreadsheet.',
  fields: {
    spreadsheet_id: {
      label: 'Spreadsheet ID',
      description:
        'The identifier of the spreadsheet. You can find this value in the URL of the spreadsheet. e.g. https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit',
      type: 'string',
      required: true,
      default: '1ORcFZ73VJXzj7rruKTrbUCgtRjqvKS4qW1uwDGP8tiY' // TODO: Remove
    },
    spreadsheet_name: {
      label: 'Spreadsheet Name',
      description:
        'The name of the spreadsheet. You can find this value on the tab at the bottom of the spreadsheet. Please provide a valid name of a sheet that already exists.',
      type: 'string',
      required: true,
      default: 'Sheet1'
    },
    data_format: {
      label: 'Data Format',
      description:
        'The way Google will interpret values. If you select raw, values will not be parsed and will be stored as-is. If you select user entered, values will be parsed as if you typed them into the UI. Numbers will stay as numbers, but strings may be converted to numbers, dates, etc. following the same rules that are applied when entering text into a cell via the Google Sheets UI.',
      type: 'string',
      required: true,
      default: 'RAW',
      choices: [
        { label: 'Raw', value: 'RAW' },
        { label: 'User Entered', value: 'USER_ENTERED' }
      ]
    },
    fields: {
      label: 'Fields',
      description: `
      The fields to write to the spreadsheet. 
      On the left-hand side, input the name of the field as it will appear in the Google Sheet. 
      On the right-hand side, select the field from your data model that maps to the given field in your sheet.
      
      ---
      
      `,
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (request, data) => {
    console.log(request)
    console.log(data)

    const sheets = google.sheets({
      version: 'v4'
    })

    const getIdentifierFromData = (data: any) => {
      return data.rawData.__segment_id
    }

    const getRange = (targetIndex: number, columnCount: number, startRow = 1, startColumn = 1) => {
      const targetRange = new A1(startColumn, targetIndex + startRow)
      targetRange.addX(columnCount)
      return targetRange.toString()
    }

    type Fields = {
      [k: string]: string
    }

    const generateColumnValuesFromFields = (identifier: string, fields: Fields, columns: string[]) => {
      const retVal = columns.map((col) => fields[col] ?? '')
      retVal.unshift(identifier) // Write identifier as first columnCount
      return retVal
    }

    if (!data.payload.fields) throw new IntegrationError('Missing Fields mapping information')
    const columns = Object.getOwnPropertyNames(data.payload.fields)

    if (!data.auth || !data.auth.accessToken) throw new IntegrationError('Missing OAuth information')
    const access_token = data.auth.accessToken

    sheets.spreadsheets.values
      .get({
        spreadsheetId: data.payload.spreadsheet_id,
        range: `${data.payload.spreadsheet_name}!A:A`,
        access_token
      })
      .then((response) => {
        const eventMap = new Map() // TODO: Fix this for batchPerform
        eventMap.set(getIdentifierFromData(data), data.payload.fields)
        const { appendBatch, updateBatch } = processGetSpreadsheetResponse(response, eventMap)

        if (updateBatch.length > 0) {
          sheets.spreadsheets.values
            .batchUpdate({
              spreadsheetId: data.payload.spreadsheet_id,
              access_token,
              requestBody: {
                valueInputOption: data.payload.data_format,
                data: updateBatch.map(({ identifier, event, targetIndex }) => {
                  const values = generateColumnValuesFromFields(identifier, event, columns)
                  return {
                    range: `${data.payload.spreadsheet_name}!${getRange(targetIndex, values.length)}`,
                    values: [values]
                  }
                })
              }
            })
            .then(() => {
              console.log('update')
            })
            .catch((error) => {
              console.log(error)
            })
        }

        if (appendBatch.length > 0) {
          sheets.spreadsheets.values
            .append({
              spreadsheetId: data.payload.spreadsheet_id,
              range: `${data.payload.spreadsheet_name}!A1`,
              valueInputOption: data.payload.data_format,
              access_token,
              requestBody: {
                values: appendBatch.map(({ identifier, event }) =>
                  generateColumnValuesFromFields(identifier, event, columns)
                )
              }
            })
            .then(() => {
              console.log('append')
            })
            .catch((error) => {
              console.log(error)
            })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
}

export default action
