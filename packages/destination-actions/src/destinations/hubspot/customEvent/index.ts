import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from './common-fields'
import { Client } from './client'
import { ActionDefinition, RequestClient, IntegrationError, StatsContext } from '@segment/actions-core'
import { dynamicFields } from './functions/dynamic-field-functions'
import { SyncMode, SchemaMatch, CachableSchema } from './types'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import {
  getSchemaFromHubspot,
  createHubspotEventSchema,
  updateHubspotSchema
} from './functions/hubspot-event-schema-functions'
import { sendEvent } from './functions/event-completion-functions'
import { validate } from './functions/validation-functions'
import { eventSchema } from './functions/schema-functions'
import { compareSchemas, saveSchemaToCache, getSchemaFromCache } from './functions/cache-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event V2',
  description: 'Send Custom Events to HubSpot',
  syncMode: {
    description: 'Specify how Segment should update event schemas in Hubspot',
    label: 'Sync Mode',
    default: 'update',
    choices: [
      { label: 'Create new and update existing custom event definitions', value: 'upsert' },
      { label: 'Create new, but do not update existing custom event definitions', value: 'add' },
      { label: 'Update existing, but do not create new custom event definitions', value: 'update' }
    ]
  },
  fields: {
    ...commonFields
  },
  dynamicFields,
  perform: async (request, { payload, syncMode, subscriptionMetadata, statsContext }) => {
    return await send(request, payload, syncMode as SyncMode, subscriptionMetadata, statsContext)
  }
}

const send = async (
  request: RequestClient,
  payload: Payload,
  syncMode: SyncMode,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
) => {
  statsContext?.tags?.push('action:custom_event')

  const client = new Client(request)
  const validPayload = validate(payload)
  const schema = eventSchema(validPayload)
  const cachedSchema = getSchemaFromCache(schema.name, subscriptionMetadata, statsContext)

  statsContext?.statsClient?.incr(`cache.get.${cachedSchema === undefined ? 'miss' : 'hit'}`, 1, statsContext?.tags)

  const cacheSchemaDiff = compareSchemas(schema, cachedSchema)

  statsContext?.statsClient?.incr(`cache.diff.${cacheSchemaDiff.match}`, 1, statsContext?.tags)

  if (cacheSchemaDiff.match === SchemaMatch.FullMatch) {
    return await sendEvent(client, (cachedSchema as CachableSchema).fullyQualifiedName, validPayload)
  }

  const hubspotSchema = await getSchemaFromHubspot(client, schema)

  statsContext?.statsClient?.incr(
    `hubspotSchema.get.${hubspotSchema === undefined ? 'miss' : 'hit'}`,
    1,
    statsContext?.tags
  )

  const hubspotSchemaDiff = compareSchemas(schema, hubspotSchema)

  statsContext?.statsClient?.incr(`hubspotSchemaDiff.diff.${hubspotSchemaDiff.match}`, 1, statsContext?.tags)

  switch (hubspotSchemaDiff.match) {
    case SchemaMatch.FullMatch: {
      await saveSchemaToCache(hubspotSchema as CachableSchema, subscriptionMetadata, statsContext)
      return await sendEvent(client, (hubspotSchema as CachableSchema).fullyQualifiedName, validPayload)
    }

    case SchemaMatch.PropertiesMissing: {
      if (syncMode === 'add') {
        throw new IntegrationError(
          `The 'Sync Mode' setting is set to 'add' which is stopping Segment from creating a new properties on the Event Schema in the HubSpot`,
          'HUBSPOT_SCHEMA_PROPERTIES_MISSING',
          400
        )
      }
      const cacheableSchema = { ...schema, fullyQualifiedName: (hubspotSchema as CachableSchema).fullyQualifiedName }
      await updateHubspotSchema(client, cacheableSchema.fullyQualifiedName, hubspotSchemaDiff)
      await saveSchemaToCache(cacheableSchema, subscriptionMetadata, statsContext)
      return await sendEvent(client, cacheableSchema.fullyQualifiedName, validPayload)
    }

    case SchemaMatch.NoMatch: {
      if (syncMode === 'update') {
        throw new IntegrationError(
          `The 'Sync Mode' setting is set to 'update' which is stopping Segment from creating a new Custom Event Schema in the HubSpot`,
          'HUBSPOT_SCHEMA_MISSING',
          400
        )
      }
      const fullyQualifiedName = await createHubspotEventSchema(client, schema)
      const cacheableSchema = { ...schema, fullyQualifiedName }
      await saveSchemaToCache(cacheableSchema, subscriptionMetadata, statsContext)
      return await sendEvent(client, cacheableSchema.fullyQualifiedName, validPayload)
    }
  }
}

export default action
