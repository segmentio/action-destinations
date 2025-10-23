
import { InputField } from '@segment/actions-core'
import { AUDIENCE_ACTION } from '../constants'

export const fields: Record<string, InputField> ={
    dmp_segment_name: {
      label: 'Segment Creation Name',
      description: 'The name of the segment to create. This field is no longer used after the Segment is created in LinkedIn.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.audience_key' },
          then: { '@path': '$.properties.audience_key' },
          else: { '@path': '$.context.personas.computation_key' }
        }
      }
    },
    enable_batching: {
      label: '[Hidden] Enable Batching',
      description: '[Hidden] Enable batching of requests to the LinkedIn DMP Segment.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    email: {
      label: 'User Email',
      description: "The user's email address to send to LinkedIn.",
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      category: 'hashedPII'
    },
    first_name: {
      label: 'User First Name',
      description: "The user's first name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.properties.first_name'
      }
    },
    last_name: {
      label: 'User Last Name',
      description: "The user's last name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.properties.last_name'
      }
    },
    title: {
      label: 'User Title',
      description: "The user's title to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.properties.title'
      }
    },
    company: {
      label: 'User Company',
      description: "The user's company to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.properties.company'
      }
    },
    country: {
      label: 'User Country',
      description:
        "The user's country to send to LinkedIn. This field accepts an ISO standardized two letter country code e.g. US.",
      type: 'string',
      default: {
        '@path': '$.properties.country'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'string',
      unsafe_hidden: false,
      default: {
        '@if': {
          exists: { '@path': '$.properties.android_idfa' },
          then: { '@path': '$.properties.android_idfa' },
          else: { '@path': '$.context.device.advertisingId' }
        }
      }
    },
    source_segment_id: {
      label: '[Hidden] LinkedIn Source Segment ID',
      description:
        "[Hidden] A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.",
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at '$.properties.audience_key' in Personas events and at '$.context.personas.computation_key' for events coming from Journeys v2.
      default: {
        '@if': {
          exists: { '@path': '$.properties.audience_key' },
          then: { '@path': '$.properties.audience_key' },
          else: { '@path': '$.context.personas.computation_key' }
        }
      }
    },
    personas_audience_key: {
      /* 
       * History of this field: 
       * This field was added because batch keys weren’t available before. 
       * So, the dev who wrote it wanted to force customers to enter a hard coded value so as to ensure all events to be sent to an action are batched together.
       * This field has now been hidden as the batch_keys field now ensures that all events in a batch are for a unique Audience. 
      */ 
      label: '[Hidden] Segment Engage Audience Key',
      description:
        '[Hidden] The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true,
      unsafe_hidden: true
    },
    event_name: {
      label: 'Event Name',
      description: 'The name of the current Segment event.',
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.event' in Personas events.
      default: {
        '@path': '$.event'
      }
    },
    dmp_user_action: {
      label: 'DMP User Action',
      description: 'Specifies if the user should be added or removed from the LinkedIn DMP User Segment.',
      type: 'string',
      choices: [
        { label: `Auto Detect`, value: 'AUTO' },
        { label: `Add`, value: AUDIENCE_ACTION.ADD },
        { label: 'Remove', value: AUDIENCE_ACTION.REMOVE }
      ],
      default: 'AUTO'
    },
    batch_keys: {
      label: '[Hidden] Batch Keys',
      description: '[Hidden] Batch key used to ensure a batch contains payloads from a single Audience only.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['source_segment_id', 'personas_audience_key']
    }
  }