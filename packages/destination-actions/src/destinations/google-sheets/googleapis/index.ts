import { RequestClient } from '@segment/actions-core'
import type { Payload } from '../postSheet/generated-types'

export const API_VERSION = 'v4'
export default class GoogleSheets {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  get = async (payload: Payload) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${payload.spreadsheet_id}/values/${payload.spreadsheet_name}!A:A`,
      {
        method: 'get'
      }
    )
  }

  batchUpdate = async (payload: Payload, batchPayload: any) => {
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

  append = async (payload: Payload, values: any) => {
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
