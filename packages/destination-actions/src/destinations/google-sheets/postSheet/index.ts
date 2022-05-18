import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { processData } from './operations'

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
    const { auth, payload } = data

    processData(auth, payload, data, request)
  },
  performBatch: async (request, data) => {
    console.log(request)
    console.log(data)
    // const { auth, payload } = data
    // processData(auth, payload[0], data)
  }
}

export default action
