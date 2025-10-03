import { ActionDefinition, RequestClient, IntegrationError, StatsContext, Features } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from './common-fields'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { Client } from './client'
import { AssociationSyncMode, SyncMode, SchemaMatch, RequestData } from './types'
import { dynamicFields } from './functions/dynamic-field-functions'
import { getSchemaFromCache, saveSchemaToCache } from './functions/cache-functions'
import {
  deDuplicateAssociations,
  ensureValidTimestamps,
  mergeAndDeduplicateById,
  validate
} from './functions/validation-functions'
import { objectSchema, compareSchemas } from './functions/schema-functions'
import { sendFromRecords } from './functions/hubspot-record-functions'
import { getListName, ensureList, sendLists } from './functions/hubspot-list-functions'
import {
  sendAssociatedRecords,
  createAssociationPayloads,
  sendAssociations
} from './functions/hubspot-association-functions'
import { getSchemaFromHubspot, createProperties } from './functions/hubspot-properties-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Object V2',
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
  dynamicFields,
  perform: async (request, { payload, syncMode, subscriptionMetadata, statsContext, features }) => {
    statsContext?.tags?.push('action:custom_object')
    return await send(request, [payload], syncMode as SyncMode, subscriptionMetadata, statsContext, features)
  },
  performBatch: async (request, data) => {
    const requestData = data as RequestData<Settings, Payload[]>
    const { payload, syncMode, subscriptionMetadata, statsContext, rawData } = requestData
    const { features } = data
    statsContext?.tags?.push('action:custom_object_batch')
    return await send(request, payload, syncMode, subscriptionMetadata, statsContext, features, rawData)
  }
}

const send = async (
  request: RequestClient,
  payloads: Payload[],
  syncMode: SyncMode,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext,
  features?: Features,
  rawData?: Payload[]
) => {
  if (syncMode === 'upsert' || syncMode === 'update') {
    payloads = ensureValidTimestamps(payloads, rawData)
    payloads = mergeAndDeduplicateById(payloads, statsContext)
  }

  const {
    object_details: { object_type: objectType, property_group: propertyGroup },
    association_sync_mode: associationSyncMode,
    list_details
  } = payloads[0]

  const flag = features?.['actions-hubspot-lists-association-support'] ?? false

  let listName: string | undefined = undefined

  const client = new Client(request, objectType)
  const validPayloads = validate(payloads, flag)

  if (flag) {
    listName = getListName(payloads[0])
  }

  const schema = objectSchema(validPayloads, objectType)

  const cachedSchema = getSchemaFromCache(schema.object_details.object_type, subscriptionMetadata, statsContext)
  statsContext?.statsClient?.incr(`cache.get.${cachedSchema === undefined ? 'miss' : 'hit'}`, 1, statsContext?.tags)

  const cacheSchemaDiff = compareSchemas(schema, cachedSchema, statsContext)
  statsContext?.statsClient?.incr(`cache.diff.${cacheSchemaDiff.match}`, 1, statsContext?.tags)

  if (cacheSchemaDiff.match === SchemaMatch.PropertiesMissing || cacheSchemaDiff.match === SchemaMatch.NoMatch) {
    const hubspotSchema = await getSchemaFromHubspot(client, schema)
    const hubspotSchemaDiff = compareSchemas(schema, hubspotSchema, statsContext)

    switch (hubspotSchemaDiff.match) {
      case SchemaMatch.FullMatch: {
        await saveSchemaToCache(schema, subscriptionMetadata, statsContext)
        break
      }
      case SchemaMatch.PropertiesMissing: {
        await createProperties(client, hubspotSchemaDiff, propertyGroup)
        await saveSchemaToCache(schema, subscriptionMetadata, statsContext)
        break
      }
      case SchemaMatch.NoMatch: {
        throw new IntegrationError('Object Type missing', 'Object Type missing', 400)
      }
    }
  }

  let cachableList = undefined
  if (flag) {
    const shouldCreateList = list_details?.should_create_list ?? false
    cachableList = await ensureList(client, objectType, listName, shouldCreateList, subscriptionMetadata, statsContext)
  }

  const fromRecordPayloads = await sendFromRecords(client, validPayloads, objectType, syncMode)
  let associationPayloads = createAssociationPayloads(fromRecordPayloads, 'associations')
  associationPayloads = deDuplicateAssociations(associationPayloads)
  const associatedRecords = await sendAssociatedRecords(
    client,
    associationPayloads,
    associationSyncMode as AssociationSyncMode
  )
  await sendAssociations(client, associatedRecords, 'create')

  if (flag) {
    const dissociationPayloads = createAssociationPayloads(fromRecordPayloads, 'dissociations')
    // We don't want to create new records when dissociating, hence forcing AssociationSyncMode.Read
    const dissociatedRecords = await sendAssociatedRecords(client, dissociationPayloads, AssociationSyncMode.Read)
    await sendAssociations(client, dissociatedRecords, 'archive')

    if (cachableList) {
      await sendLists(client, cachableList, fromRecordPayloads)
    }
  }

  return
}

export default action
