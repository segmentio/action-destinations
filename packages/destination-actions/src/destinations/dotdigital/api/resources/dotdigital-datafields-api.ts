import {
  RequestClient,
  DynamicFieldResponse,
  ModifiedResponse,
  APIError,
  PayloadValidationError
} from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DotdigitalApi from '../dotdigital-api'
import { DataField, DataFieldType } from '../types'
import type { Payload } from '../../addContactToList/generated-types'

class DotdigitalDataFieldsApi extends DotdigitalApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
  }

  /**
   * Fetches the list of data fields from Dotdigital API.
   *
   * @returns A promise that resolves to a DynamicFieldResponse.
   */
  async getDataFields(): Promise<DynamicFieldResponse> {
    try {
      const choices = []
      const response: ModifiedResponse = await this.get('/v2/data-fields/')
      const content: DataField[] = JSON.parse(response.content);
      choices.push(...content.map((dataField: DataField) => ({
        value: dataField.name,
        label: dataField.name,
        type: dataField.type as DataFieldType | undefined
      })));

      return {choices}
    } catch (error) {
      return {
        choices: [],
        nextPage: '',
        error: {
          message: (error as APIError).message ?? 'Unknown error',
          code: (error as APIError).status + '' ?? 'Unknown error'
        }
      }
    }
  }

  isNumeric(value: unknown): boolean {
    const type = typeof value;
    return ((type === "number" || type === "string") && !isNaN(Number(value)));
  }

  async validateDataFields(payload: Payload) {
    if (!payload.dataFields) {
      return payload.dataFields
    }
    const response: ModifiedResponse = await this.get('/v2/data-fields/')
    const dotdigitalDataFields: DataField[] = JSON.parse(response.content)

    for (const [key, value] of Object.entries(payload.dataFields)) {
      let formattedValue = value;
      const dotdigitalDataField = dotdigitalDataFields.find((obj) => obj.name === key)
      if (!dotdigitalDataField) {
        throw new PayloadValidationError(`Data field ${key} not found in Dotdigital`)
      }

      switch (dotdigitalDataField.type) {
        case 'Date':
          if (typeof value !== 'string') {
            throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid date`)
          } else {
            const date = new Date(value).toISOString()
            if (date === undefined) {
              throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid date`)
            }
            formattedValue = date
          }
          break
        case 'Numeric':
          if (typeof value === 'string') {
            if (!this.isNumeric(value)) {
              throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid number`)
            }
          } else if (typeof value !== 'number') {
            throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid number`)
          }
          break
        case 'Boolean':
          if (typeof value === 'string' && value === 'true') {
            formattedValue = true
          } else if (typeof value === 'string' && value === 'false') {
            formattedValue = false
          }
          formattedValue = Boolean(formattedValue)
          break
        case 'String':
          if (typeof value !== 'string') {
            throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid string`)
          }
          formattedValue = String(value).trim()
          break
      }

      payload.dataFields[key] = formattedValue
    }
    return payload.dataFields
  }
}

export default DotdigitalDataFieldsApi
