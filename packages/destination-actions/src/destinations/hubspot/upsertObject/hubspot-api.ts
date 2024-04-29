import { RequestClient } from '@segment/actions-core'
import { HubSpotError } from '../errors'
import { HUBSPOT_BASE_URL } from '../properties'

export class HubspotClient {
  request: RequestClient
  objectType?: string
  toObjectType?: string

  constructor(request: RequestClient, objectType?: string, toObjectType?: string) {
    this.request = request
    this.objectType = objectType
    this.toObjectType = toObjectType
  }

  async getObjectTypes() {
    interface ObjectSchema {
        labels: { singular: string; plural: string }
        fullyQualifiedName: string
    }
    
    interface GetSchemasResponse {
        results: ObjectSchema[]
    }

    const defaultChoices = [
      {
        label: 'Contact',
        value: 'contact'
      },
      {
        label: 'Company',
        value: 'company'
      },
      {
        label: 'Deal',
        value: 'deal'
      },
      {
        label: 'Ticket',
        value: 'ticket'
      }
    ]
    // API Doc - https://developers.hubspot.com/docs/api/crm/crm-custom-objects#endpoint?spec=GET-/crm/v3/schemas
    try {
      const response = await this.request<GetSchemasResponse>(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
        method: 'GET',
        skipResponseCloning: true
      })
      const choices = response.data.results
        .map((schema) => ({
          label: `${schema.labels.plural} (Custom)`,
          value: schema.fullyQualifiedName
        }))
      return {
        choices: [...choices, ...defaultChoices]
      }
    } catch (err) {
      return {
        choices: [],
        error: {
          message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error',
          code: (err as HubSpotError)?.response?.status + '' ?? '500'
        }
      }
    }
  }
}
