import {
  IntegrationError,
  ActionDefinition,
  DynamicFieldResponse,
  isObject,
  ErrorCodes,
  MultiStatusResponse,
  JSONLikeObject,
  JSONObject
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { OnMappingSaveInputs, OnMappingSaveOutputs, Payload } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import isEmpty from 'lodash/isEmpty'
import { createCatalog, getCatalogNames, getItemKeys, isValidItemId, processMultiStatusErrorResponse } from './utils'
import { UpsertCatalogItemErrorResponse } from './types'
import { ActionHookDefinition, ActionHookResponse } from '@segment/actions-core/destination-kit'

const UPSERT_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ type: 'field', fieldKey: '__segment_internal_sync_mode', operator: 'is', value: 'upsert' }]
}

const CREATE_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'create' }]
}

const SELECT_OPERATION: DependsOnConditions = {
  match: 'all',
  conditions: [{ fieldKey: 'operation', operator: 'is', value: 'select' }]
}

const catalogHook: ActionHookDefinition<Settings, Payload, any, OnMappingSaveInputs, OnMappingSaveOutputs> = {
  label: 'Select or Create a Catalog',
  description: 'Select an existing catalog or create a new one in Braze.',
  inputFields: {
    operation: {
      label: 'Operation',
      description: 'Whether to select an existing catalog or create a new one in Braze.',
      type: 'string',
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      choices: [
        { label: 'Create a new catalog', value: 'create' },
        { label: 'Select an existing catalog', value: 'select' }
      ],
      required: true
    },
    selected_catalog_name: {
      label: 'Catalog Name',
      description: 'The unique name of the catalog.',
      type: 'string',
      required: SELECT_OPERATION,
      disabledInputMethods: ['literal', 'variable', 'function', 'freeform', 'enrichment'],
      depends_on: SELECT_OPERATION,
      dynamic: async (request: RequestClient, { settings }: { settings: Settings }): Promise<DynamicFieldResponse> => {
        return getCatalogNames(request, { settings })
      }
    },
    created_catalog_name: {
      label: 'Catalog Name',
      description:
        'The name of the catalog. Must be unique. Maximum 250 characters. Supported characters: letters, numbers, hyphens, and underscores.',
      type: 'string',
      required: CREATE_OPERATION,
      depends_on: CREATE_OPERATION
    },
    description: {
      label: 'Catalog Description',
      description: 'The description of the catalog. Maximum 250 characters.',
      type: 'string',
      depends_on: CREATE_OPERATION
    },
    columns: {
      label: 'Catalog Fields',
      description: 'A list of fields to create in the catalog. Maximum 500 fields. ID field is added by default.',
      type: 'object',
      multiple: true,
      defaultObjectUI: 'arrayeditor',
      additionalProperties: true,
      required: CREATE_OPERATION,
      depends_on: CREATE_OPERATION,
      properties: {
        name: {
          label: 'Field Name',
          description:
            'The name of the field. Maximum 250 characters. Supported characters: letters, numbers, hyphens, and underscores.',
          type: 'string',
          required: true
        },
        type: {
          label: 'Field Type',
          description: 'The data type of the field.',
          type: 'string',
          required: true,
          choices: ['string', 'number', 'time', 'boolean', 'object', 'array']
        }
      }
    }
  },
  performHook: async (request, { settings, hookInputs }): Promise<ActionHookResponse<{ catalog_name: string }>> => {
    if (hookInputs?.operation === 'select') {
      // If the operation is select, we don't need to create a catalog
      return {
        successMessage: 'Catalog selected successfully',
        savedData: {
          catalog_name: hookInputs?.selected_catalog_name ?? ''
        }
      }
    }
    return await createCatalog(request, settings.endpoint, hookInputs)
  },
  outputTypes: {
    catalog_name: {
      label: 'Catalog Name',
      description: 'The name of the catalog.',
      type: 'string',
      required: true
    }
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Catalog Item',
  description: 'Upserts or deletes items in a catalog',
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
    item: {
      label: 'Catalog item to upsert',
      description:
        'The item to upsert in the catalog. The item object should contain fields that exist in the catalog. The item object should not contain the id field.',
      type: 'object',
      required: UPSERT_OPERATION,
      depends_on: UPSERT_OPERATION,
      defaultObjectUI: 'keyvalue:only',
      dynamic: true
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
    }
  },
  hooks: {
    onMappingSave: { ...catalogHook }
  },
  dynamicFields: {
    item: {
      __keys__: async (request, { settings, payload }) => {
        return await getItemKeys(request, settings, payload)
      }
    }
  },
  perform: async (request, { settings, payload, syncMode, hookOutputs }) => {
    const catalog_name = hookOutputs?.onMappingSave?.outputs?.catalog_name

    const { item_id = '' } = payload

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
  performBatch: async (request, { settings, payload, syncMode, hookOutputs }) => {
    const catalog_name = hookOutputs?.onMappingSave?.outputs?.catalog_name

    const multiStatusResponse = new MultiStatusResponse()

    const validPayloadMap = new Map<string, number>()

    const items = []

    for (let batchIndex = 0; batchIndex < payload.length; batchIndex++) {
      const { item_id = '', item = {} } = payload[batchIndex]

      if (validPayloadMap.has(item_id)) {
        multiStatusResponse.setErrorResponseAtIndex(batchIndex, {
          status: 400,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: 'Every item in the batch must have a unique item_id'
        })
        continue
      }
      let body: JSONObject = {}
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
          ...(item as JSONObject)
        }
      }
      body.id = item_id

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
