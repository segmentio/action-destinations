import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { processPayload } from '../../launchdarkly-audiences/syncAudience/custom-audience-operations'
import { CONSTANTS } from '../constants'
import { AudienceAction, Priority } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Engage Audiences to LaunchDarkly segments',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'hidden',
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    context_kind: {
      label: 'Context kind',
      description:
        "The event's context kind. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).",
      type: 'string',
      required: true,
      default: 'user'
    },
    segment_user_id: {
      label: 'Segment User ID',
      description: 'The Segment userId value.',
      type: 'hidden',
      required: false,
      default: { '@path': '$.userId' }
    },
    segment_anonymous_id: {
      label: 'Segment Anonymous ID',
      description: 'The Segment anonymousId value.',
      type: 'hidden',
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    user_email: {
      label: 'Email address',
      description: "The user's email address",
      type: 'hidden',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    context_key: {
      label: 'Context key',
      description: 'The unique LaunchDarkly context key. In most cases the Segment UserId should be used.',
      type: 'string',
      required: true,
      default: Priority.UserIdOnly,
      choices: [
        { value: Priority.UserIdThenEmail, label: 'Use Segment UserId or email' },
        { value: Priority.UserIdThenAnonymousId, label: 'Use Segment UserId or Segment AnonymousId' },
        { value: Priority.UserIdThenEmailThenAnonymousId, label: 'Use Segment UserId or email or Segment AnonymousId' },
        { value: Priority.UserIdOnly, label: 'Use Segment UserId only' },
        { value: Priority.EmailOnly, label: 'Use email only' }
      ]
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    enable_batching: {
      type: 'boolean',
      label: 'Batch events',
      description:
        'When enabled, the action will batch events before sending them to LaunchDarkly. In most cases, batching should be enabled.',
      required: false,
      default: true
    },
    audience_action: {
      label: 'Audience Action',
      description: 'Indicates if the user will be added or removed from the Audience',
      type: 'hidden',
      choices: [
        { label: CONSTANTS.ADD as AudienceAction, value: CONSTANTS.ADD as AudienceAction },
        { label: CONSTANTS.REMOVE as AudienceAction, value: CONSTANTS.REMOVE as AudienceAction }
      ]
    }
  },

  perform: (request, { payload, settings }) => {
    payload.audience_action = payload.traits_or_props[payload.segment_audience_key] ? CONSTANTS.ADD : CONSTANTS.REMOVE
    return processPayload(request, settings, [payload])
  },

  performBatch: (request, { payload, settings }) => {
    payload.forEach(
      (event) =>
        (event.audience_action = event.traits_or_props[event.segment_audience_key] ? CONSTANTS.ADD : CONSTANTS.REMOVE)
    )
    return processPayload(request, settings, payload)
  }
}

export default action
