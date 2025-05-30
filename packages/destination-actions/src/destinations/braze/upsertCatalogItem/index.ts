import {
  IntegrationError,
  ActionDefinition,
  DynamicFieldItem,
  DynamicFieldResponse,
  isObject,
  ErrorCodes,
  MultiStatusResponse,
  JSONLikeObject
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { generateMultiStatusError } from '../utils'
import { RequestClient } from '@segment/actions-core'
import { DependsOnConditions, FieldTypeName } from '@segment/actions-core/destination-kit/types'
import isEmpty from 'lodash/isEmpty'
import { getCatalogMetas, isValidItemId, processMultiStatusErrorResponse } from './utils'
import { UpsertCatalogItemErrorResponse } from './types'

const UPSERT_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ type: 'field', fieldKey: '__segment_internal_sync_mode', operator: 'is', value: 'upsert' }]
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Catalog Item',
  description: 'Upserts or deletes items in  a catalog',
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
      description: 'The name of the catalog to upsert the item to.',
      type: 'string',
      dynamic: true,
      required: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment']
    },
    item: {
      label: 'Catalog item to upsert or delete',
      description:
        'The item to upsert in the catalog. The item objects should contain fields that exist in the catalog. The item object is not required when the syncMode is set to delete. The item object should not contain the id field.',
      type: 'object',
      required: UPSERT_OPERATION,
      additionalProperties: true
    },
    item_id: {
      label: 'Item ID',
      description:
        'The unique identifier for the item. Maximum 250 characters. Supported characters: letters, numbers, hyphens, and underscores.',
      type: 'string',
      required: true,
      maximum: 250,
      minimum: 1
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch Data to Braze?',
      description: 'If true, Segment will batch events before sending to Braze.',
      default: true
    },
    batch_size: {
      type: 'number',
      label: 'Batch Size',
      description:
        'If batching is enabled, this is the number of events to include in each batch. Maximum 50 events per batch.',
      minimum: 1,
      maximum: 50,
      default: 50,
      unsafe_hidden: true
    },
    batch_keys: {
      type: 'string',
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['catalog_name']
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
    if (syncMode !== 'upsert' && syncMode !== 'delete') {
      throw new IntegrationError(
        'Invalid syncMode, must be set to "upsert" or "delete"',
        'PAYLOAD_VALIDATION_FAILED',
        400
      )
    }

    const { catalog_name = '', item_id = '' } = payload

    const { item = {} } = payload

    // validate item_id
    if (!isValidItemId(item_id)) {
      throw new IntegrationError(`Invalid ID Format`, ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
    }

    if (syncMode === 'upsert') {
      // validate item
      if (isObject(item) && isEmpty(item)) {
        throw new IntegrationError('Item is required', ErrorCodes.PAYLOAD_VALIDATION_FAILED, 400)
      }
    }

    try {
      return await request(`${settings.endpoint}/catalogs/${catalog_name}/items/${item_id}`, {
        method: syncMode === 'upsert' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          items: [item]
        }
      })
    } catch (error) {
      if (
        (error?.response?.data as UpsertCatalogItemErrorResponse)?.errors?.[0]?.id === 'item-not-found' &&
        syncMode === 'delete'
      ) {
        return {
          status: 200,
          message: 'Could not find item'
        }
      } else {
        throw new IntegrationError(
          `${error?.response?.data?.errors?.[0]?.message}`,
          `Error ${syncMode}ing item`,
          (error?.response?.status as number) ?? 500
        )
      }
    }
  },
  performBatch: async (request, { settings, payload, syncMode }) => {
    if (syncMode !== 'upsert' && syncMode !== 'delete') {
      // Return a multi-status error if the syncMode is invalid
      return generateMultiStatusError(payload.length, 'Invalid syncMode, must be set to "upsert" or "delete"')
    }

    const multiStatusResponse = new MultiStatusResponse()

    const validPayloadMap = new Map<string, number>()

    const { catalog_name = '' } = payload[0]

    const items = []

    for (let batchIndex = 0; batchIndex < payload.length; batchIndex++) {
      const { item_id = '', item = {} } = payload[batchIndex]

      let body = {}

      if (validPayloadMap.has(item_id)) {
        multiStatusResponse.setErrorResponseAtIndex(batchIndex, {
          status: 400,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: 'Every item in the batch must have a unique item_id'
        })
        continue
      }

      // validate item_id
      if (!isValidItemId(item_id)) {
        multiStatusResponse.setErrorResponseAtIndex(batchIndex, {
          status: 400,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: 'Invalid ID Format'
        })
        continue
      }
      if (syncMode === 'upsert') {
        // validate item
        if (isObject(item) && isEmpty(item)) {
          multiStatusResponse.setErrorResponseAtIndex(batchIndex, {
            status: 400,
            errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
            errormessage: 'Item is required'
          })
          continue
        }
        body = {
          id: item_id,
          ...item
        }
      } else {
        body = {
          id: item_id
        }
      }
      items.push(body)
      validPayloadMap.set(item_id, batchIndex)
    }
    if (items.length === 0) {
      return multiStatusResponse
    }

    try {
      const response = await request(`${settings.endpoint}/catalogs/${catalog_name}/items/`, {
        method: syncMode === 'upsert' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          items
        }
      })

      validPayloadMap.forEach((index, id) => {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 200,
          sent: { ...payload[index]?.item, id } as JSONLikeObject,
          body: response?.data as JSONLikeObject
        })
      })
    } catch (error) {
      processMultiStatusErrorResponse(
        error?.response?.data as UpsertCatalogItemErrorResponse,
        multiStatusResponse,
        validPayloadMap,
        payload
      )
    }

    return multiStatusResponse
  }
}

export default action
