import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from './common-fields'
import { Client } from './client'
import { ActionDefinition, RequestClient, IntegrationError } from '@segment/actions-core'
import { dynamicReadEventNames, dynamicReadObjectTypes, dynamicReadProperties } from './dynamic-fields'
import { SyncMode, SchemaMatch } from './types'
import {
  compareToCache,
  compareToHubspot,
  createHubspotEventSchema,
  eventSchema,
  saveSchemaToCache,
  sendEvent,
  updateHubspotSchema,
  validate
} from './utils'

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
  dynamicFields: {
    event_name: async (request) => {
      return await dynamicReadEventNames(request)
    },
    record_details: {
      object_type: async (request) => {
        return await dynamicReadObjectTypes(request)
      }
    },
    properties: {
      __keys__: async (request, { payload }) => {
        const eventName = payload?.event_name
        if (!eventName) {
          throw new Error("Select from 'Event Name' first")
        }
        return await dynamicReadProperties(request, eventName)
      }
    }
  },
  perform: async (request, { payload, syncMode }) => {
    return await send(request, payload, syncMode as SyncMode)
  }
}

const send = async (request: RequestClient, payload: Payload, syncMode: SyncMode) => {
  const client = new Client(request)

  const validPayload = validate(payload)

  const schema = eventSchema(validPayload)

  const cacheSchemaDiff = await compareToCache(schema)

  switch (cacheSchemaDiff.match) {
    case SchemaMatch.FullMatch: {
      return await sendEvent(client, cacheSchemaDiff?.fullyQualifiedName as string, validPayload)
    }

    case SchemaMatch.Mismatch: {
      throw new IntegrationError('Cache schema mismatch.', 'CACHE_SCHEMA_MISMATCH', 400)
    }

    case SchemaMatch.NoMatch:
    case SchemaMatch.PropertiesMissing: {
      const hubspotSchemaDiff = await compareToHubspot(client, schema)
      switch (hubspotSchemaDiff.match) {
        case SchemaMatch.FullMatch: {
          const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
          const name = hubspotSchemaDiff?.name as string
          await saveSchemaToCache(fullyQualifiedName, name, schema)
          return await sendEvent(client, fullyQualifiedName, validPayload)
        }

        case SchemaMatch.Mismatch: {
          throw new IntegrationError('Hubspot schema mismatch.', 'HUBSPOT_SCHEMA_MISMATCH', 400)
        }

        case SchemaMatch.NoMatch: {
          if (syncMode === 'update') {
            throw new IntegrationError(
              `The 'Sync Mode' setting is set to 'update' which is stopping Segment from creating a new Custom Event Schema in the HubSpot`,
              'HUBSPOT_SCHEMA_MISSING',
              400
            )
          }

          const schemaDiff = await createHubspotEventSchema(client, schema)
          const fullyQualifiedName = schemaDiff?.fullyQualifiedName as string
          const name = schemaDiff?.name as string
          await saveSchemaToCache(fullyQualifiedName, name, schema)
          return await sendEvent(client, fullyQualifiedName, validPayload)
        }

        case SchemaMatch.PropertiesMissing: {
          if (syncMode === 'add') {
            throw new IntegrationError(
              `The 'Sync Mode' setting is set to 'add' which is stopping Segment from creating a new properties on the Event Schema in the HubSpot`,
              'HUBSPOT_SCHEMA_PROPERTIES_MISSING',
              400
            )
          }

          const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
          const name = hubspotSchemaDiff?.name as string
          await updateHubspotSchema(client, fullyQualifiedName, hubspotSchemaDiff)
          await saveSchemaToCache(fullyQualifiedName, name, schema)
          return await sendEvent(client, fullyQualifiedName, validPayload)
        }
      }
    }
  }
}

export default action
