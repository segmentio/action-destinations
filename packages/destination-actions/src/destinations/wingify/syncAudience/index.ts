import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { hosts } from '../utility'
import type { WingifyAudienceJSON } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Syncs Segment audiences to Wingify',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    name: {
      description: 'Name of the event',
      label: 'Event Name',
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    userId: {
      description: 'A unique identifier for the user',
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
        '@path': '$.context.personas.computation_key'
      }
    }
  },
  perform: async (request, { settings, payload, audienceMembership }) => {
    const epochTime = new Date().valueOf()
    const time = Math.floor(epochTime)
    const audienceAction = audienceMembership ? 'audience_entered' : 'audience_exited'
    const wingifyPayload: WingifyAudienceJSON = {
      d: {
        event: {
          name: 'wingify_integration',
          time,
          props: {
            action: audienceAction,
            audienceName: payload.audienceId,
            audienceId: payload.audienceId,
            identifier: payload.userId ?? payload.anonymousId ?? '',
            accountId: settings.wingifyAccountId ?? 0,
            integration: 'segment'
          }
        }
      }
    }
    const region = settings.region || 'US'
    const host = hosts[region] ?? hosts.US
    const endpoint = `${host}/events/t?en=wingify_integration&a=${settings.wingifyAccountId}`

    return request(endpoint, {
      method: 'POST',
      json: wingifyPayload
    })
  }
}

export default action
