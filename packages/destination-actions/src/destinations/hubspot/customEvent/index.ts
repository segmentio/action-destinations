import { ActionDefinition, RequestClient, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HubspotClient, SyncMode, SchemaMatch } from './hubspot-api'
import { commonFields } from './common-fields'
import { validate } from './utils'

import { dynamicReadEventNames, dynamicReadObjectTypes, dynamicReadProperties } from './dynamic-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send Custom Events to HubSpot',
  syncMode: {
    description: 'Specify how Segment should update event schemas in Hubspot',
    label: 'Sync Mode',
    default: 'update',
    choices: [
      { label: 'Create new event schemas, and update existing event schemas', value: 'upsert' },
      { label: 'Create new event schemas, but do not update existing event schemas', value: 'add' },
      { label: 'Update existing event schemas, but do not create new event schemas', value: 'update' }
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
  const client = new HubspotClient(request, syncMode)

  const validPayload = validate(payload)

  const schema = client.schema(validPayload)

  const cacheSchemaDiff = await client.compareToCache(schema)

  switch (cacheSchemaDiff.match) {
    case SchemaMatch.FullMatch: {
      return await client.sendEvent(cacheSchemaDiff?.fullyQualifiedName as string, validPayload)
    }

    case SchemaMatch.Mismatch: {
      throw new IntegrationError('Cache schema mismatch.', 'CACHE_SCHEMA_MISMATCH', 400)
    }

    case SchemaMatch.NoMatch:
    case SchemaMatch.PropertiesMissing: {
      const hubspotSchemaDiff = await client.compareToHubspot(schema)

      switch (hubspotSchemaDiff.match) {
        case SchemaMatch.FullMatch: {
          const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
          const name = hubspotSchemaDiff?.name as string
          await client.saveSchemaToCache(fullyQualifiedName, name, schema)
          return await client.sendEvent(fullyQualifiedName, validPayload)
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

          const schemaDiff = await client.createHubspotEventSchema(schema)
          const fullyQualifiedName = schemaDiff?.fullyQualifiedName as string
          const name = schemaDiff?.name as string
          await client.saveSchemaToCache(fullyQualifiedName, name, schema)
          return await client.sendEvent(fullyQualifiedName, validPayload)
        }

        case SchemaMatch.PropertiesMissing: {
          if (client.syncMode === 'add') {
            throw new IntegrationError(
              `The 'Sync Mode' setting is set to 'add' which is stopping Segment from creating a new properties on the Event Schema in the HubSpot`,
              'HUBSPOT_SCHEMA_PROPERTIES_MISSING',
              400
            )
          }

          const fullyQualifiedName = hubspotSchemaDiff?.fullyQualifiedName as string
          const name = hubspotSchemaDiff?.name as string
          await client.updateHubspotSchema(fullyQualifiedName, hubspotSchemaDiff)
          await client.saveSchemaToCache(fullyQualifiedName, name, schema)
          return await client.sendEvent(fullyQualifiedName, validPayload)
        }
      }
    }
  }
}

export default action
