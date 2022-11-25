import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { processData } from './operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Sheet',
  description: 'Write values to a Google Sheets spreadsheet.',
  defaultSubscription: 'event = "updated" or event = "new"',
  // TODO: Hide record_identifier and operation_type
  fields: {
    record_identifier: {
      label: 'Record Identifier',
      description: 'Property which uniquely identifies each row in the spreadsheet.',
      type: 'string',
      required: true,
      default: { '@path': '$.__segment_id' }
    },
    operation_type: {
      label: 'Operation Type',
      description:
        "Describes the nature of the operation being performed. Only supported values are 'new' and 'updated'.",
      type: 'hidden',
      required: true,
      default: { '@path': '$.event' }
    },
    spreadsheet_id: {
      label: 'Spreadsheet ID',
      description:
        'The identifier of the spreadsheet. You can find this value in the URL of the spreadsheet. e.g. https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit',
      type: 'string',
      required: true,
      default: ''
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
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Google Sheets',
      description: 'Set as true to ensure Segment sends data to Google Sheets in batches. Please do not set to false.',
      default: true
    }
  },
  perform: (request, { payload }) => {
    return processData(request, [payload])
  },
  performBatch: (request, { payload }) => {
    return processData(request, payload)
  }
}

export default action
