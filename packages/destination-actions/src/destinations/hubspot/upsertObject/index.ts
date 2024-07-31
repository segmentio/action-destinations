import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, AssociationSyncMode, SyncMode } from './hubspot-api'
import { commonFields } from './common-fields'
import {
  dynamicReadAssociationLabels,
  dynamicReadIdFields,
  dynamicReadObjectTypes,
  dynamicReadPropertyGroups
} from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Object',
  description:
    'Upsert a record of any Object type to HubSpot and optionally assocate it with another record of any Object type.',
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
          throw new Error("Select from 'Object Type' first")
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
      from_object_type: fromObjectType,
      from_id_field_name: fromIdFieldName,
      from_property_group: fromPropertyGroup
    },
    association_sync_mode: assocationSyncMode
  } = payloads[0]

  const client = new HubspotClient(
    request,
    fromObjectType,
    fromIdFieldName,
    syncMode,
    assocationSyncMode as AssociationSyncMode,
    fromPropertyGroup
  )

  if (fromPropertyGroup) {
    const uniquePayloadsProperties = client.uniquePayloadsProperties(payloads)
    const propertiesFromHSchema = await client.propertiesFromHSchema()
    const propertiesToCreate = client.propertiesToCreateInHSSchema(uniquePayloadsProperties, propertiesFromHSchema)
    await client.ensurePropertiesInHSSchema(propertiesToCreate)
  }
  const fromRecordsOnHS = await client.ensureFromRecordsOnHubspot(payloads)
  const associations = client.getAssociationsFromPayloads(fromRecordsOnHS)
  const toRecordsOnHS = await client.ensureToRecordsOnHubspot(associations)
  await client.ensureAssociations(toRecordsOnHS)
}

export default action
