import { RequestClient } from '@segment/actions-core'
import type { MappingSettings } from '../postSheet/operations'

export const API_VERSION = 'v4'
export default class GoogleSheets {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  get = async (mappingSettings: MappingSettings, range: string) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values/${mappingSettings.spreadsheetName}!${range}`,
      {
        method: 'get'
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

  append = async (mappingSettings: MappingSettings, range: string, values: string[][]) => {
    return this.request(
      `https://sheets.googleapis.com/${API_VERSION}/spreadsheets/${mappingSettings.spreadsheetId}/values/${mappingSettings.spreadsheetName}!${range}:append?valueInputOption=${mappingSettings.dataFormat}`,
      {
        method: 'post',
        json: {
          values: values
        }
      }
    )
  }
}
