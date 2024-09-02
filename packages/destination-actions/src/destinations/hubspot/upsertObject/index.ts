import { ActionDefinition, RequestClient, IntegrationError } from '@segment/actions-core'
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
      object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      },
      id_field_name: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.object_type

        if (!fromObjectType) {
          throw new Error("Select a value from the 'Object Type' field")
        }

        return await dynamicReadIdFields(request, fromObjectType)
      },
      property_group: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.object_type

        if (!fromObjectType) {
          throw new Error("Select a value from the 'Object Type' field")
        }

        return await dynamicReadPropertyGroups(request, fromObjectType)
      }
    },
    properties: {
      __keys__: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.object_type

        if (!fromObjectType) {
          throw new Error("Select a value from the 'Object Type' field")
        }

        return await dynamicReadProperties(request, fromObjectType, false)
      }
    },
    sensitive_properties: {
      __keys__: async (request, { payload }) => {
        const fromObjectType = payload?.object_details?.object_type

        if (!fromObjectType) {
          throw new Error("Select a value from the 'Object Type' field")
        }

        return await dynamicReadProperties(request, fromObjectType, true)
      }
    },
    associations: {
      object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      },
      association_label: async (request, { dynamicFieldContext, payload }) => {
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex

        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }

        const fromObjectType = payload?.object_details?.object_type
        const toObjectType = payload?.associations?.[selectedIndex]?.object_type

        if (!fromObjectType) {
          throw new Error("Select a value from the from 'Object Type' field")
        }

        if (!toObjectType) {
          throw new Error("Select a value from the 'To Object Type' field")
        }

        return await dynamicReadAssociationLabels(request, fromObjectType, toObjectType)
      },
      id_field_name: async (request, { dynamicFieldContext, payload }) => {
        const selectedIndex = dynamicFieldContext?.selectedArrayIndex

        if (selectedIndex === undefined) {
          throw new Error('Selected array index is missing')
        }

        const toObjectType = payload?.associations?.[selectedIndex]?.object_type

        if (!toObjectType) {
          throw new Error("Select a value from the 'To Object Type' field")
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
    object_details: { object_type: objectType, property_group: propertyGroup },
    association_sync_mode: assocationSyncMode
  } = payloads[0]

  const client = new HubspotClient(
    request,
    objectType,
    syncMode,
    assocationSyncMode as AssociationSyncMode,
    propertyGroup
  )

  const cleanedPayloads = client.validate(payloads)
  const schema = client.schema(cleanedPayloads)
  const schemaDiffCache = await client.schemaDiffCache(schema)

  switch (schemaDiffCache.match) {
    case SchemaMatch.FullMatch: {
      const fromRecordPayloads = await client.sendFromRecords(cleanedPayloads)
      const associationPayloads = client.createAssociationPayloads(fromRecordPayloads)
      const associatedRecords = await client.sendAssociatedRecords(associationPayloads)
      await client.sendAssociations(associatedRecords)
      return
    }
    case SchemaMatch.PropertiesMissing:
    case SchemaMatch.NoMatch: {
      const schemaDiffHubspot = await client.schemaDiffHubspot(schema)

      switch (schemaDiffHubspot.match) {
        case SchemaMatch.FullMatch: {
          await client.saveSchemaToCache(schema)
          break
        }
        case SchemaMatch.PropertiesMissing: {
          await client.createProperties(schemaDiffHubspot)
          await client.saveSchemaToCache(schema)
          break
        }
        case SchemaMatch.NoMatch: {
          throw new IntegrationError('Object Type missing', 'Object Type missing', 400)
        }
      }

      const fromRecordPayloads = await client.sendFromRecords(cleanedPayloads)
      const associationPayloads = client.createAssociationPayloads(fromRecordPayloads)
      const associatedRecords = await client.sendAssociatedRecords(associationPayloads)
      await client.sendAssociations(associatedRecords)
    }
  }
}

export default action
