import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Syncs Segment audiences to VWO',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
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
        '@path': '$.properties.audience_key'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const epochTime = new Date().valueOf()
    const time = Math.floor(epochTime)
    let action
    if (payload.name == 'Audience Entered') {
      action = 'audience_entered'
    } else if (payload.name == 'Audience Exited') {
      action = 'audience_exited'
    }
    const vwoPayload = {
      d: {
        event: {
          name: 'vwo_integration',
          time,
          props: {
            action,
            audienceName: payload.audienceId,
            audienceId: payload.audienceId,
            identifier: payload.userId || payload.anonymousId,
            accountId: settings.vwoAccountId,
            integration: 'segment'
          }
        }
      }
    }
    const endpoint = `https://dev.visualwebsiteoptimizer.com/events/t?en=vwo_integration&a=${settings.vwoAccountId}`

    return request(endpoint, {
      method: 'POST',
      json: vwoPayload
    })
  }
}

export default action
