import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, AssociationSyncMode, SyncMode } from './hubspot-api'
import { commonFields } from './common-fields'
import { SchemaMatch } from './hubspot-api'

import {
  dynamicReadAssociationLabels,
  dynamicReadIdFields,
  dynamicReadObjectTypes,
  dynamicReadPropertyGroups,
  dynamicReadProperties
} from './dynamic-fields'
import { IntegrationError } from '@segment/actions-core/*'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object',
  description:
    'Add, create or update records of any Object type to HubSpot, and optionally assocate that record with other records of any Object type.',
  syncMode: {
    description: 'Specify how Segment should update Records in Hubspot',
    label: 'Sync Mode',
    default: 'update',
    choices: [
      { label: 'Create new records, and update existing records', value: 'upsert' },
      { label: 'Create new records, but do not update existing records', value: 'add' },
      { label: 'Update existing records, but do not create new records', value: 'update' }
    ]
  },
  fields: {
    ...commonFields
  },
  dynamicFields: {
    object_details: {
      from_object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      },
      from_id_field_name: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }

        return await dynamicReadIdFields(request, fromObjectType)
      },
      from_property_group: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }

        return await dynamicReadPropertyGroups(request, fromObjectType)
      }
    },
    properties: {
      __keys__: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }

        return await dynamicReadProperties(request, fromObjectType, false)
      }
    },
    sensitive_properties: {
      __keys__: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.from_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }

        return await dynamicReadProperties(request, fromObjectType, true)
      }
    },
    associations: {
      to_object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      },
      association_label: async (request, { dynamicFieldContext, payload }) => {
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex

        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }

        const fromObjectType = payload?.object_details?.from_object_type
        const toObjectType = payload?.associations?.[selectedIndex]?.to_object_type

        if (!fromObjectType) {
          throw new Error("Select from 'From Object Type' first")
        }

        if (!toObjectType) {
          throw new Error("Select from 'To Object Type' first")
        }

        return await dynamicReadAssociationLabels(request, fromObjectType, toObjectType)
      },
      to_id_field_name: async (request, { dynamicFieldContext, payload }) => {
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex

        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }

        const toObjectType = payload?.associations?.[selectedIndex]?.to_object_type

        if (!toObjectType) {
          throw new Error("Select from 'To Object Type' first")
        }

        return await dynamicReadIdFields(request, toObjectType)
      }
    }
  },
  perform: async (request, { payload, syncMode }) => {
    await send(request, [payload], syncMode as SyncMode)
  },
  performBatch: async (request, { payload, syncMode }) => {
    await send(request, payload, syncMode as SyncMode)
  }
}

const send = async (request: RequestClient, payloads: Payload[], syncMode: SyncMode) => {
  const {
    object_details: {
      object_type: objectType,
      id_field_name: idFieldName,
      property_group: propertyGroup
    },
    association_sync_mode: assocationSyncMode
  } = payloads[0]

  const client = new HubspotClient(
    request,
    objectType,
    idFieldName,
    syncMode,
    assocationSyncMode as AssociationSyncMode,
    propertyGroup
  )

  console.log("-2")
  const ploads = client.cleanProps(payloads)
  console.log("-1")
  const schema = client.schema(ploads)
  
  console.log("0")

  const diffCache = await client.schemaDiffCache(schema)

  console.log("1")

  const diffHS = await client.schemaDiffHubspot(schema)
  console.log(diffHS)
//  console.log(diffHS)

  switch(diffHS.match){

    case SchemaMatch.FullMatch: {
      console.log("3")
      const e = await client.sendEvents(ploads)
      break
    }
    case SchemaMatch.PropertiesMissing: {
      console.log("4")
      await client.createProperties(diffHS)
      const e = await client.sendEvents(ploads)
      break
    }
    case SchemaMatch.NoMatch: {
      console.log("5")
      throw new IntegrationError('Object missing', 'Object missing', 400)
    }
  }  
  console.log("6")
  const a = await client.associationPayloads(ploads, ['object_type', 'id_field_name'])
  console.log(a)
}

export default action
