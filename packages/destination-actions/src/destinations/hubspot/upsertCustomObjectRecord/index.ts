import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import { HubSpotError } from '../errors'
import { flattenObject } from '../helperFunctions'

interface ObjectSchema {
  labels: { singular: string; plural: string }
  fullyQualifiedName: string
}

interface GetSchemasResponse {
  results: ObjectSchema[]
}

// slug name - upsertCustomObjectRecord. We will be introducing upsert logic soon.
// To avoid slug name changes in future, naming it as upsertCustomObjectRecord straight away.
const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Custom Object Record',
  description: 'Create records of Deals, Tickets or other Custom Objects in HubSpot.',
  fields: {
    objectType: {
      label: 'Object Type',
      description:
        'The CRM object schema to use for creating a record. This can be a standard object (i.e. tickets, deals) or ***fullyQualifiedName*** of a custom object. Schema for the Custom Objects must be predefined in HubSpot. More information on Custom Objects and *fullyQualifiedName* in [HubSpot documentation](https://developers.hubspot.com/docs/api/crm/crm-custom-objects#retrieve-existing-custom-objects).',
      type: 'string',
      required: true,
      dynamic: true
    },
    properties: {
      label: 'Properties',
      description:
        'Properties to send to HubSpot. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. Please make sure to include the object’s required properties. Any custom properties must be predefined in HubSpot. More information in [HubSpot documentation](https://knowledge.hubspot.com/crm-setup/manage-your-properties#create-custom-properties).',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only',
      allowNull: false
    }
  },
  dynamicFields: {
    objectType: async (request, _) => {
      return getCustomObjects(request)
    }
  },
  perform: async (request, { payload }) => {
    return request(`${HUBSPOT_BASE_URL}/crm/v3/objects/${payload.objectType}`, {
      method: 'POST',
      json: {
        properties: flattenObject(payload.properties)
      }
    })
  }
}

async function getCustomObjects(request: RequestClient) {
  // List of HubSpot defined Objects that segment has OAuth Scope to access
  const defaultChoices = [
    { value: 'deals', label: 'Deals' },
    { value: 'tickets', label: 'Tickets' }
  ]

  try {
    // API Doc - https://developers.hubspot.com/docs/api/crm/crm-custom-objects#endpoint?spec=GET-/crm/v3/schemas
    //
    const response = await request<GetSchemasResponse>(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
      method: 'GET',
      skipResponseCloning: true
    })
    const choices = response.data.results.map((schema) => ({
      label: schema.labels.plural,
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
        code: (err as HubSpotError)?.response?.data?.category ?? 'Unknown code'
      }
    }
  }
}

export default action
