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
        /*time: {
          label: 'Time',
          description: "The time an event occurred. It has to respect the RFC 3339 format.",
          type: 'string',
          allowNull: true
        },*/
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
  // Parcourir les événements et obtenir la taille du lot pour chaque événement
  const events = (data.events || []).map((event: any) => {
    // Récupérer la taille du lot pour cet événement (par défaut à 15 si non spécifiée)
    const eventAttributesBatchSize = event.event_attributes_batch_size || 15

    // Récupérer les attributs de l'événement
    const eventAttributes = event.attributes || {}

    // Limiter les attributs de l'événement en fonction de la taille du lot
    const limitedEventAttributes = Object.keys(eventAttributes)
      .slice(0, eventAttributesBatchSize)
      .reduce((obj: Record<string, any>, key: string) => {
        obj[key] = eventAttributes[key]
        return obj
      }, {})

    // Retourner l'événement avec ses attributs limités
    return {
      name: event.name,
      attributes: limitedEventAttributes
    }
  })

  // Récupération des identifiants
  const identifiers = {
    custom_id: data.identifiers?.custom_id || '' // Assurer que custom_id soit une chaîne non nulle
  }

  // Retourner le JSON final avec les identifiants, attributs et événements
  return [
    {
      identifiers: identifiers,
      events: events
    }
  ]
}

export default action
