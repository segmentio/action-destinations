import {
  IntegrationError,
  ActionDefinition,
  DynamicFieldItem,
  DynamicFieldResponse,
  isObject
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { isValidItemId, getCatalogMetaByName, getCatalogMetas } from '../utils'
import { RequestClient } from '@segment/actions-core/*'
import { DependsOnConditions, FieldTypeName } from '@segment/actions-core/destination-kit/types'
import isEmpty from 'lodash/isEmpty'
// import { JSONSchema4TypeName } from 'json-schema'

export interface CatalogSchema {
  description?: string
  fields?: {
    name: string
    token: string
    type: string
  }[]
  name: string
  num_items?: Number
  storage_size?: Number
  updated_at?: string
  selections_size?: Number
  source?: Number
  selections: unknown[]
}

export interface ListCatalogsResponse {
  catalogs?: CatalogSchema[]
  message?: string
}

const UPSERT_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ type: 'field', fieldKey: '__segment_internal_sync_mode', operator: 'is', value: 'upsert' }]
}

// function toJsonSchemaType(type: 'string' | 'number' | 'time' | 'boolean'): JSONSchema4TypeName | JSONSchema4TypeName[] {
//   switch (type) {
//     case 'time':
//       return ['string', 'number']
//     default:
//       return type
//   }
// }

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Catalog Item',
  description: 'Updates or insert items to relevant catalogs',
  syncMode: {
    description: 'Define how the records from your destination will be synced.',
    label: 'How to sync records',
    default: 'upsert',
    choices: [
      { label: 'Upsert Catalog Item', value: 'upsert' },
      { label: 'Delete Catalog Item', value: 'delete' }
    ]
  },
  fields: {
    catalog_name: {
      label: 'Catalog Name',
      description: 'The Name of the catalog to which the item belongs.',
      type: 'string',
      required: true
    },
    item: {
      label: 'Catalog Item On to Upsert',
      description:
        'The item to upsert in the catalog. The item objects should contain fields that exist in the catalog. The item object is not required when the syncMode is set to delete. The item object should not contain the id field.',
      type: 'object',
      required: UPSERT_OPERATION
    },
    item_id: {
      label: 'Item ID',
      description:
        'The unique identifier for the item. This field is required. Maximum 250 characters. Supported characters for item ID names are letters, numbers, hyphens, and underscores.',
      type: 'string',
      required: true,
      maximum: 250,
      minimum: 1
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze',
      description: 'If true, Segment will batch events before sending to Braze.',
      default: true
    },
    batch_size: {
      type: 'number',
      label: 'Batch Size',
      description: 'If batching is enabled, this is of events to include in each batch. Maximum 50 events per batch.',
      minimum: 1,
      maximum: 50,
      default: 50
    }
  },
  dynamicFields: {
    catalog_name: async (
      request: RequestClient,
      { settings }: { settings: Settings }
    ): Promise<DynamicFieldResponse> => {
      let choices: DynamicFieldItem[] = []
      try {
        const catalogs = await getCatalogMetas(request, settings.endpoint)

        if (catalogs?.length) {
          choices = catalogs.map((catalog) => ({
            label: catalog.name,
            value: catalog.name,
            type: 'string' as FieldTypeName,
            description: catalog?.description
          }))
          return {
            choices
          }
        }
        return {
          choices,
          error: {
            message: 'No catalogs found. Please create a catalog first',
            code: '404'
          }
        }
      } catch (err) {
        return {
          choices,
          error: {
            message: 'Unknown error. Please try again later',
            code: '500'
          }
        }
      }
    }
  },
  perform: async (request, { settings, payload, syncMode }) => {
    const { catalog_name = '', item = {}, item_id = '' } = payload

    // validate catalog_name
    const itemCatalog = await getCatalogMetaByName(request, settings.endpoint, catalog_name)

    // validate item_id
    if (!isValidItemId(item_id)) {
      throw new IntegrationError(`Invalid ID Format`, 'Invalid ID Format', 400)
    }

    if (syncMode === 'upsert') {
      // validate item
      if (isObject(item) && isEmpty(item)) {
        throw new IntegrationError('Item is required', 'Item is required', 400)
      }

      itemCatalog.fields = itemCatalog.fields?.filter((field) => field.name !== 'id')

      return await request(`${settings.endpoint}/catalogs/${catalog_name}/items/${item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          items: [item]
        }
      })
    } else {
      try {
        return await request(`${settings.endpoint}/catalogs/${catalog_name}/items/${item_id}`, {
          method: 'DELETE',
          json: true
        })
      } catch (error) {
        if (error?.status === 400 && error?.response?.data?.errors?.[0]?.id === 'item_not_found') {
          return {
            status: 200,
            message: 'Could not find item'
          }
        } else {
          throw new IntegrationError(`${error?.response?.data?.errors?.[0]?.message}`, 'Error deleting item', 500)
        }
      }
    }
  }
}

export default action
