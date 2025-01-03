import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: '',
  fields: {
    identifiers: {
      label: 'Identifiers',
      description: "Identifiant(s) de l'utilisateur",
      type: 'object',
      properties: {
        custom_id: {
          label: 'User ID',
          description: 'The unique profile identifier',
          type: 'string',
          required: true,
          default: {
            '@path': '$.userId'
          }
        }
      }
    },
    events: {
      label: 'Event',
      description: 'Profile event',
      type: 'object',
      required: false,
      multiple: true,
      properties: {
        name: {
          label: 'Name',
          description: "The event's name",
          type: 'string',
          required: true,
          default: {
            '@path': '$.event'
          }
        },
        time: {
          label: 'Time',
          description: 'The time an event occurred. It has to respect the RFC 3339 format.',
          type: 'datetime',
          allowNull: true,
          default: {
            '@path': '$.receivedAt'
          }
        },
        attributes: {
          label: 'attributes',
          description: "An object containing all event's attributes",
          type: 'object',
          allowNull: true,
          default: {
            '@path': '$.properties'
          }
        },
        event_attributes_batch_size: {
          label: 'Event Attribute Batch Size',
          description: 'Maximum number of attributes to include in an event.',
          type: 'number',
          default: 15,
          unsafe_hidden: true
        }
      }
    }
  },
  perform: (request, data) => {
    console.dir(data, { depth: null }) // log the resolved payload before mappings
    const newPayload = buildProfileJsonWithEvents(data.payload)
    console.dir(newPayload, { depth: null }) // log the resolved payload after mappings

    return request('https://api.batch.com/2.2/profiles/update', {
      method: 'post',
      json: newPayload
    })
  },
  performBatch: (request, data) => {
    console.dir(data.payload, { depth: null }) // log the resolved payload after mappings

    return request('https://api.batch.com/2.2/profiles/update', {
      method: 'post',
      json: data.payload
    })
  }
}

function buildProfileJsonWithEvents(data: Payload) {
  // Browse events and obtain the batch size for each event
  const events = (data.events || []).map((event: any) => {
    // Retrieve the batch size for this event (default 15 if not specified)
    const eventAttributesBatchSize = event.event_attributes_batch_size || 15

    // Retrieve event attributes
    const eventAttributes = event.attributes || {}

    // Limit event attributes according to batch size
    const limitedEventAttributes = Object.keys(eventAttributes)
      .slice(0, eventAttributesBatchSize) // Limite la taille à 'batchSize'
      .reduce((obj: Record<string, any>, key: string) => {
        const value = eventAttributes[key]
        // Check if the value is an ISO 8601 date and add 'date()' prefix to the key
        if (isISO8601Date(value as string)) {
          console.dir('value date = ' + value, { depth: null })
          obj[`date(${key})`] = value
        }
        // Check if the value is a valid URL and add 'url()' prefix to the key
        else if (isValidUrl(value as string)) {
          console.dir('value url = ' + value, { depth: null })
          obj[`url(${key})`] = value
        } else {
          obj[key] = value
        }

        return obj
      }, {})

    // Return the event with its limited attributes
    return {
      name: event.name,
      attributes: limitedEventAttributes
    }
  })

  // Recovery of identifiers
  const identifiers = {
    custom_id: data.identifiers?.custom_id || '' // Assurer que custom_id soit une chaîne non nulle
  }

  // Return the final JSON with identifiers, attributes and events
  return [
    {
      identifiers: identifiers,
      events: events
    }
  ]
}

// Utility function to check if a string is in ISO 8601 date format
function isISO8601Date(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3,6})?Z$/
  return typeof value === 'string' && iso8601Regex.test(value)
}

// Utility function to check if a string is a valid URL
function isValidUrl(value: string): boolean {
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return typeof value === 'string' && urlRegex.test(value)
}

export default action
