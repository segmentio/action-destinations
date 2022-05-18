import type { ActionDefinition } from '@segment/actions-core'
import { DynamicFieldResponse } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import QualtricsApiClient, { Directory } from '../qualtricsApiClient'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add / Update Contact in XMD',
  description: 'Add or update contact in XMD',
  defaultSubscription: 'type = "identify"',
  fields: {
    directoryId: {
      label: 'Directory ID',
      type: 'string',
      description: 'Directory id. Also known as the Pool ID. POOL_XXX',
      required: true,
      default: {
        '@path': '$.traits.directoryId'
      }
    },
    extRef: {
      label: 'External Data Reference',
      type: 'string',
      description: 'The external data reference which is a unique identifier for the user',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      label: 'Email',
      type: 'string',
      description: 'Email of contact',
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      label: 'Phone number',
      type: 'string',
      description: 'Phone number of contact',
      default: {
        '@path': '$.traits.phone'
      }
    },
    firstName: {
      label: 'First Name',
      type: 'string',
      description: 'First name of contact',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    lastName: {
      label: 'Last Name',
      type: 'string',
      description: 'Last name of contact',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    language: {
      label: 'Language',
      type: 'string',
      description: 'Language code of the contact',
      default: {
        '@if': {
          exists: { '@path': '$.traits.language' },
          then: { '@path': '$.traits.language' },
          else: 'EN'
        }
      }
    },
    unsubscribed: {
      label: 'Contact is unsubscribed',
      type: 'boolean',
      description: 'Should the contact be unsubscribed from correspondence',
      default: false
    },
    embeddedData: {
      label: 'User embedded data',
      type: 'object',
      description: 'User embedded data (properties of the user)',
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    directoryId: async (request: RequestClient, data): Promise<DynamicFieldResponse> => {
      const apiClient = new QualtricsApiClient(data.settings.datacenter, data.settings.apiToken, request)
      const response = await apiClient.listDirectories()
      const fields = response.elements.map((element: Directory) => {
        return { value: element.directoryId, label: element.name }
      })
      return {
        body: {
          data: fields,
          pagination: {}
        }
      }
    }
  },
  perform: (request, data) => {
    const apiClient = new QualtricsApiClient(data.settings.datacenter, data.settings.apiToken, request)
    const payload = {
      firstName: data.payload.firstName,
      lastName: data.payload.lastName,
      phone: data.payload.phone,
      email: data.payload.email,
      extRef: data.payload.extRef,
      unsubscribed: data.payload.unsubscribed,
      language: data.payload.language,
      embeddedData: data.payload.embeddedData
    }
    return apiClient.createDirectoryContact(data.payload.directoryId, payload)
  }
}

export default action
