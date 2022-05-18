import { RequestClient } from '@segment/actions-core'
import type { MappingSettings } from '../postSheet/operations'

export const API_VERSION = 'v4'
export default class GoogleSheets {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  get = async (mappingSettings: MappingSettings) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values/${mappingSettings.spreadsheetName}!A:A`,
      {
        method: 'get'
      }
    )
  }

<<<<<<< HEAD
  batchUpdate = async (payload: Payload, batchPayload: any) => {
=======
  batchUpdate = async (mappingSettings: MappingSettings, batchPayload: { range: string; values: string[][] }[]) => {
>>>>>>> b8bd0ee (cleaned up some types)
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${payload.spreadsheet_id}/values:batchUpdate`,
      {
        method: 'post',
        json: {
          valueInputOption: payload.data_format,
          data: batchPayload
        }
      }
    )
  }

<<<<<<< HEAD
  append = async (payload: Payload, values: any) => {
=======
  append = async (mappingSettings: MappingSettings, values: string[][]) => {
>>>>>>> b8bd0ee (cleaned up some types)
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${payload.spreadsheet_id}/values/${payload.spreadsheet_name}!A2:append?valueInputOption=${payload.data_format}`,
      {
        method: 'post',
        json: {
          values: values
        }
      }
    )
  }
}
