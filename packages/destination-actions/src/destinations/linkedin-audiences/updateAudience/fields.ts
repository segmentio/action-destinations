
import { InputField } from '@segment/actions-core'

export const fields: Record<string, InputField> ={
    dmp_segment_name: {
      label: 'DMP Segment Display Name',
      description:
        'The display name of the LinkedIn DMP Segment. This field is set only when Segment creates a new audience. Updating this field after Segment has created an audience will not update the audience name in LinkedIn.',
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
      label: 'Enable Batching',
      description: 'Enable batching of requests to the LinkedIn DMP Segment.',
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
          else: { '@path': '$.traits.email' }
        }
      },
      category: 'hashedPII'
    },
    first_name: {
      label: 'User First Name',
      description: "The user's first name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.firstName'
      }
    },
    last_name: {
      label: 'User Last Name',
      description: "The user's last name to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.lastName'
      }
    },
    title: {
      label: 'User Title',
      description: "The user's title to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.title'
      }
    },
    company: {
      label: 'User Company',
      description: "The user's company to send to LinkedIn.",
      type: 'string',
      default: {
        '@path': '$.traits.company'
      }
    },
    country: {
      label: 'User Country',
      description:
        "The user's country to send to LinkedIn. This field accepts an ISO standardized two letter country code e.g. US.",
      type: 'string',
      default: {
        '@path': '$.traits.country'
      }
    },
    google_advertising_id: {
      label: 'User Google Advertising ID',
      description: "The user's Google Advertising ID to send to LinkedIn.",
      type: 'string',
      unsafe_hidden: true, // This field is hidden from customers because the desired value always appears at path '$.context.device.advertisingId' in Personas events.
      default: {
        '@path': '$.context.device.advertisingId'
      }
    },
    source_segment_id: {
      label: 'LinkedIn Source Segment ID',
      description:
        "A Segment-specific key associated with the LinkedIn DMP Segment. This is the lookup key Segment uses to fetch the DMP Segment from LinkedIn's API.",
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
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
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
      description: 'A Segment specific key used to define action type.',
      type: 'string',
      choices: [
        { label: `Auto Detect`, value: 'AUTO' },
        { label: `Add`, value: 'ADD' },
        { label: 'Remove', value: 'REMOVE' }
      ],
      default: 'AUTO'
    }
  }