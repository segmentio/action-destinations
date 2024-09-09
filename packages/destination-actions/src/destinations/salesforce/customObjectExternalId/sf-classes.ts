import { DynamicFieldResponse, RequestClient } from '@segment/actions-core'
import { SalesforceError, SObjectsResponseData } from '../sf-operations'
import { validateInstanceURL } from '../sf-utils'
import { Payload } from './generated-types'

export class SalesforceV61 {
  API_VERSION = 'v61.0'
  instanceUrl: string
  request: RequestClient

  constructor(instanceUrl: string, request: RequestClient) {
    this.instanceUrl = validateInstanceURL(instanceUrl)

    // If the instanceUrl does not end with '/' append it to the string.
    // This ensures that all request urls are constructed properly
    this.instanceUrl = this.instanceUrl.concat(instanceUrl.slice(-1) === '/' ? '' : '/')
    this.request = request
  }

  async customObjectName(): Promise<DynamicFieldResponse> {
    try {
      const result = await this.request<SObjectsResponseData>(
        `${this.instanceUrl}services/data/${this.API_VERSION}/sobjects`,
        {
          method: 'get',
          skipResponseCloning: true
        }
      )

      const fields = result.data.sobjects.filter((field) => {
        return field.createable === true
      })

      const choices = fields.map((field) => {
        return { value: field.name, label: field.label }
      })

      return {
        choices: choices,
        nextPage: '2'
      }
    } catch (err) {
      return {
        choices: [],
        nextPage: '',
        error: {
          message: (err as SalesforceError).response?.data[0]?.message ?? 'Unknown error',
          code: (err as SalesforceError).response?.data[0]?.errorCode ?? 'Unknown error'
        }
      }
    }
  }

  async upsertRecord(payload: Payload, customObjectName: string): Promise<any> {
    const result = await this.request(
      `${this.instanceUrl}services/data/${this.API_VERSION}/sobjects/${customObjectName}/${payload.externalIdField}/${payload.externalIdValue}`,
      {
        method: 'patch',
        json: payload.customFields
      }
    )

    return result
  }
}
