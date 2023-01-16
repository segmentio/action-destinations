import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { MappingSettings } from '../postSheet/operations'

const API_VERSION = 'v4'

export type GetResponse = {
  range: string
  majorDimension: string
  values: string[][]
}
export class GoogleSheets {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  get = async (mappingSettings: MappingSettings, range: string): Promise<ModifiedResponse<GetResponse>> => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values/${mappingSettings.spreadsheetName}!${range}`,
      {
        method: 'get',
        skipResponseCloning: true
      }
    )
  }

  batchUpdate = async (mappingSettings: MappingSettings, batchPayload: { range: string; values: string[][] }[]) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values:batchUpdate`,
      {
        method: 'post',
        json: {
          valueInputOption: mappingSettings.dataFormat,
          data: batchPayload
        }
      }
    )
  }

  // TODO: Re-enable delete once locking is supported.
  // batchClear = async (mappingSettings: MappingSettings, deletePayload: { range: string }[]) => {
  //   return this.request(
  //     `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values:batchClear`,
  //     {
  //       method: 'post',
  //       json: {
  //         ranges: deletePayload.map((p) => p.range)
  //       }
  //     }
  //   )
  // }

  append = async (mappingSettings: MappingSettings, range: string, values: string[][]) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values/${mappingSettings.spreadsheetName}!${range}:append?valueInputOption=${mappingSettings.dataFormat}&insertDataOption=INSERT_ROWS`,
      {
        method: 'post',
        json: {
          values: values
        }
      }
    )
  }
}
