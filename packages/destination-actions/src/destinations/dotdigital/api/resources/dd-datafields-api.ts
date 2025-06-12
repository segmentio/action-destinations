import { RequestClient, DynamicFieldResponse, ModifiedResponse, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { DataField } from '../types'
import type { Payload } from '../../addContactToList/generated-types'
import type { FieldTypeName } from '@segment/actions-core/destination-kittypes'

class DDDataFieldsApi extends DDApi {
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
      const response: ModifiedResponse<DataField[]> = await this.get<DataField[]>('/v2/data-fields/')
      const dataFields = response.data

      choices.push(
        ...dataFields.map((dataField) => ({
          value: dataField.name,
          label: dataField.name,
          type: this.mapDataFieldType(dataField.type)
        }))
      )

      return { choices }
    } catch (error) {
      return {
        choices: [],
        nextPage: '',
        error: {
          message: 'Failed to fetch data fields',
          code: 'DATA_FIELDS_FETCH_ERROR'
        }
      }
    }
  }

  mapDataFieldType(fieldType: string): FieldTypeName {
    switch (fieldType) {
      case 'String':
        return 'string'
      case 'Numeric':
        return 'number'
      case 'Date':
        return 'datetime'
      case 'Boolean':
        return 'boolean'
      default:
        throw new PayloadValidationError(`Invalid data field type: ${fieldType}`)
    }
  }

  isNumeric(value: unknown): boolean {
    const type = typeof value
    return (type === 'number' || type === 'string') && !isNaN(Number(value))
  }

  async validateDataFields(payload: Payload) {
    if (!payload.dataFields) {
      return
    }

    const response: ModifiedResponse<DataField[]> = await this.get<DataField[]>('/v2/data-fields/')
    const ddDataFields = response.data

    for (const [key, value] of Object.entries(payload.dataFields)) {
      let validatedValue = value
      const ddDataField = ddDataFields.find((obj) => obj.name === key)

      if (!ddDataField) {
        throw new PayloadValidationError(`Data field ${key} not found in Dotdigital`)
      }

      switch (ddDataField.type) {
        case 'Date':
          if (typeof value !== 'string') {
            throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid date`)
          } else {
            const date = new Date(value).toISOString()
            if (date === undefined) {
              throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid date`)
            }
            validatedValue = date
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
          if (typeof value === 'string' && value.trim().toLocaleLowerCase() === 'true') {
            validatedValue = true
          } else if (typeof value === 'string' && value.trim().toLocaleLowerCase() === 'false') {
            validatedValue = false
          }
          validatedValue = Boolean(validatedValue)
          break
        case 'String':
          if (typeof value !== 'string') {
            throw new PayloadValidationError(`Data field ${key} value ${value} is not a valid string`)
          }
          validatedValue = String(value).trim()
          break
      }

      payload.dataFields[key] = validatedValue
    }
    return payload.dataFields
  }
}

export default DDDataFieldsApi
