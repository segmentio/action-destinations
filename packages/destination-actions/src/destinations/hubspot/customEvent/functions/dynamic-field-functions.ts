import { RequestClient } from '@segment/actions-core'
import { HubSpotError } from '../../errors'
import { HUBSPOT_BASE_URL } from '../../properties'
import { SUPPORTED_HUBSPOT_OBJECT_TYPES, DEFAULT_CUSTOM_EVENT_PROPERTIES } from '../constants'
import { cleanEventName } from './validation-functions'
import { DynamicFieldResponse } from '@segment/actions-core'
import { Payload } from '../generated-types'

export const dynamicFields = {
  event_name: async (request: RequestClient) => {
    return await dynamicReadEventNames(request)
  },
  record_details: {
    object_type: async (request: RequestClient) => {
      return await dynamicReadObjectTypes(request)
    }
  },
  properties: {
    __keys__: async (request: RequestClient, { payload }: { payload: Payload }) => {
      const eventName = payload?.event_name
      if (!eventName) {
        throw new Error("Select from 'Event Name' first")
      }
      return await dynamicReadProperties(request, eventName)
    }
  }
}

async function dynamicReadEventNames(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    labels: {
      singular: string | null
      plural: string | null
    }
    archived: boolean
    fullyQualifiedName: string
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(
      `${HUBSPOT_BASE_URL}/events/v3/event-definitions/?includeProperties=false`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    return {
      choices: response.data.results
        .filter((event: ResultItem) => !event.archived && (event.labels?.singular || event.labels?.plural))
        .map((event: ResultItem) => {
          return {
            label: event.labels?.singular ?? event.labels?.plural ?? '',
            value: event.fullyQualifiedName
          }
        })
        .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadEventNames',
        code: code
      }
    }
  }
}

async function dynamicReadObjectTypes(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    labels: { singular: string; plural: string }
    fullyQualifiedName: string
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  const defaultChoices = SUPPORTED_HUBSPOT_OBJECT_TYPES

  try {
    const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
      method: 'GET',
      skipResponseCloning: true
    })
    const choices = response.data.results.map((schema) => ({
      label: `${schema.labels.plural} (Custom)`,
      value: schema.fullyQualifiedName
    }))
    return {
      choices: [...choices, ...defaultChoices].sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      )
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadObjectTypes',
        code: code
      }
    }
  }
}

async function dynamicReadProperties(request: RequestClient, eventName: string): Promise<DynamicFieldResponse> {
  interface ResultItem {
    labels: {
      singular: string | null
      plural: string | null
    }
    archived: boolean
    fullyQualifiedName: string
    name: string
    properties: Array<{
      archived: boolean
      label: string
      name: string
      type: string
      displayOrder: number
    }>
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    // initially get full list of events. API doesn't offer ability to filter using fullyQualifiedName
    const response: ResponseType = await request(
      `${HUBSPOT_BASE_URL}/events/v3/event-definitions/?includeProperties=true`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    const cleanedEventName = cleanEventName(eventName)

    return {
      choices: (() => {
        const choices = response.data.results
          .filter(
            (event: ResultItem) =>
              (event.fullyQualifiedName === cleanedEventName || event.name === cleanedEventName) && !event.archived
          )
          .map((event: ResultItem) => {
            if (!event.properties || event.properties.length === 0) {
              return {
                label: `No properties found for event ${eventName}`,
                value: ''
              }
            }
            return event.properties
              .filter((property) => !property.archived)
              .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
              .map((property) => {
                return {
                  label: `${property.label} - ${property.type}`,
                  value: property.name
                }
              })
          })
          .flat()

        if (choices.length === 0) {
          return DEFAULT_CUSTOM_EVENT_PROPERTIES
        }

        return choices
      })()
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadProperties',
        code: code
      }
    }
  }
}
