import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Segment Audiences, Computed Traits and user profile traits Taguchi Lists.',
  fields: {
    identifiers: {
      label: 'Subscriber Identifiers',
      description: 'At least one identifier is required. Any identifiers sent will then become required for fugure updates to that Subscriber.',
      type: 'object',
      required: true,
      properties: {
        ref: {
          label: 'Reference',
          description: 'A unique identifier for the Subscriber.',
          type: 'string'
        },
        email: {
          label: 'Email',
          description: 'Email address of the Subscriber.',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone Number',
          description: 'Phone number of the Subscriber.',
          type: 'string'
        },
        id: {
          label: 'ID',
          description: 'The internal Taguchi ID of the Subscriber. usually not visible ourside the Taguchi platform.',
          type: 'integer'
        },
      }
    },
    traits: {
      label: 'Traits',
      description: 'Standard traits for the Subscriber. All text fields. No specific formats for any of them.',
      type: 'object',
      required: false,
      additionalProperties: true,
      properties: {
        title: {
          label: 'Title',
          description: 'Title of the Subscriber.',
          type: 'string',
          required: false
        },
        firstname: {
          label: 'First Name',
          description: 'First name of the Subscriber.',
          type: 'string',
          required: false
        },
        lastname: {
          label: 'Last Name',
          description: 'Last name of the Subscriber.',
          type: 'string',
          required: false
        },
        dob: {
          label: 'Date of Birth',
          description:
            "Date of birth of the Subscriber in ISO 8601 format (YYYY-MM-DD).",
          type: 'string',
          format: 'date-time',
          required: false
        },
        address: {
          label: 'Address Line 1',
          description:
            "Primary address line for the Subscriber.",
          type: 'string',
          required: false
        },
        address2:{
            label:'Address Line 2',
            description:'Secondary address line for the Subscriber.',
            type:'string',
            required:false
        },
        address3:{
            label:'Address Line 3',
            description:'Tertiary address line for the Subscriber.',
            type:'string',
            required:false
        },
        suburb: {
          label: 'Suburb',
          description: 'Suburb of the Subscriber.',
          type: 'string',
          required: false
        },
        state: {
          label: 'State',
          description: 'State of the Subscriber.',
          type: 'string',
          required: false
        },
        country: {
          label: 'Country',
          description: 'Country of the Subscriber.',
          type: 'string',
          required: false
        },
        postcode: {
          label: 'Postcode',
          description: 'Postcode of the Subscriber.',
          type: 'string',
          required: false
        },
        gender: {
          label: 'Gender',
          description: 'Gender of the Subscriber.',
          type: 'string',
          required: false
        }
      },
      default: {
        title: { '@path': '$.traits.title' },
        firstname: { '@path': '$.traits.first_name' },
        lastname: { '@path': '$.traits.last_name' },
        dob: { '@path': '$.traits.birthday' },
        address: { '@path': '$.traits.street' },
        address2: { '@path': '$.traits.address2' },
        address3: { '@path': '$.traits.address3' },
        suburb: { '@path': '$.traits.city' },
        state: { '@path': '$.traits.state' },
        country: { '@path': '$.traits.country' },
        postcode: { '@path': '$.traits.postal_code' },
      }
    },
    subscribeLists: {
      label: 'Lists to subscribe to',
      description: 'Array or comma delimited list of Taguchi List IDs to subscribe the Subscriber to.',
      type: 'string',
      multiple: true
    },
    unsubscribeLists: {
      label: 'Lists to unsubscribe from',
      description: 'Array or comma delimited list of Taguchi List IDs to unsubscribe the Subscriber from.',
      type: 'string',
      multiple: true
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ). Defaults to the current time if not provided.',
      type: 'string',
      format: 'date-time',
      required: true,
      default: { '@path': '$.timestamp' }
    }
  },
  perform: async (request, {payload, settings}) => {
    await send(request, [payload], settings, false)
  },
  performBatch: async (request, { payload, settings }) => {
    await send(request, payload, settings, true)
  }
}

export default action
