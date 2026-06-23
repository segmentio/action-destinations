import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { hosts } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Syncs Segment audiences to Wingify',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    name: {
      description: 'Name of the event',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      description: 'An unique identifier for the user',
      label: 'User ID',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      description: 'Anonymous ID for users',
      label: 'Anonymous ID',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    audienceId: {
      description: "Segment's audience ID",
      label: 'Audience ID',
      required: true,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.context.personas.computation_key' },
          then: { '@path': '$.context.personas.computation_key' },
          else: { '@path': '$.properties.audience_key' }
        }
      }
    }
  },
  perform: async (request, { settings, payload, audienceMembership }) => {
    const epochTime = new Date().valueOf()
    const time = Math.floor(epochTime)
    const action = audienceMembership ? 'audience_entered' : 'audience_exited'
    const wingifyPayload = {
      d: {
        event: {
          name: 'wingify_integration',
          time,
          props: {
            action,
            audienceName: payload.audienceId,
            audienceId: payload.audienceId,
            identifier: payload.userId || payload.anonymousId,
            accountId: settings.wingifyAccountId,
            integration: 'segment'
          }
        }
      }
    }
    const region = settings.region || 'US'
    const host = hosts[region]
    const endpoint = `${host}/events/t?en=wingify_integration&a=${settings.wingifyAccountId}`

    return request(endpoint, {
      method: 'POST',
      json: wingifyPayload
    })
  }
}

export default action
