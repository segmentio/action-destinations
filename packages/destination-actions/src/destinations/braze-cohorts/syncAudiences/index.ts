import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Record custom events in Braze',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    external_id: {
      label: 'External User ID',
      description: 'The unique user identifier',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string'
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string'
        }
      }
    },
    device_id: {
      label: 'Device ID',
      description: 'The unique device Identifier',
      type: 'string'
    },
    cohort_id: {
      label: 'Cohort ID',
      description: 'The Cohort Identifier',
      type: 'hidden',
      default: {
        '@path': '$.personas.computation_id'
      }
    },
    name: {
      label: 'Cohort Name',
      description: 'The name of Cohort',
      type: 'hidden',
      default: {
        '@path': '$.personas.computation_key'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the Braze cohorts.',
      type: 'boolean',
      default: true
    },
    personas_audience_key: {
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
    },
    event_properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: (request, { settings }) => {
    // const {  external_id } = payload
    const partnerName = 'segment'
    return request(`${settings.endpoint}/partners/${partnerName}/cohorts/users`, {
      method: 'post',
      json: {
        client_secret: settings.client_secret,
        partner_api_key: 'partner-api-key',
        cohort_id: 'will_add_in_constant',
        cohort_changes: []
      }
    })

    // // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    // const user_alias = getUserAlias(payload.user_alias)

    // if (!braze_id && !user_alias && !external_id) {
    //   throw new IntegrationError(
    //     'One of "external_id" or "user_alias" or "braze_id" is required.',
    //     'Missing required fields',
    //     400
    //   )
    // }

    // return request(`${settings.endpoint}/users/track`, {
    //   method: 'post',
    //   json: {
    //     events: [
    //       {
    //         braze_id,
    //         external_id,
    //         user_alias,
    //         app_id: settings.app_id,
    //         name: payload.name,
    //         time: toISO8601(payload.time),
    //         properties: payload.properties,
    //         _update_existing_only: payload._update_existing_only
    //       }
    //     ]
    //   }
    // })
  }
}

export default action
