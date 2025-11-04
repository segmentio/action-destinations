import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

function isValidSlackUrl(webhookUrl: string): boolean {
  return /^https:\/\/[a-zA-Z0-9.-]+\.slack.com[/a-zA-Z0-9]+$/.test(webhookUrl)
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post Message',
  description:
    'Post a message to the specified Slack workspace and channel when the associated trigger criteria are met.',
  fields: {
    url: {
      label: 'Webhook URL',
      description: 'The webhook provided by Slack to connect with the desired Slack workspace.',
      type: 'string',
      required: true,
      format: 'uri'
    },
    text: {
      label: 'Message',
      required: true,
      description:
        "The text message to post to Slack. You can use [Slack's formatting syntax.](https://api.slack.com/reference/surfaces/formatting)",
      type: 'text'
    },
    channel: {
      label: 'Channel',
      description:
        'The channel within the Slack workspace. Do not include the `#` character. For example, use `general`, not `#general`.',
      type: 'string'
    },
    username: {
      label: 'User',
      description: 'The sender of the posted message.',
      type: 'string',
      default: 'Segment'
    },
    icon_url: {
      label: 'Icon URL',
      description: 'The URL of the image that appears next to the User.',
      type: 'string',
      default: 'https://cdn.brandfetch.io/segment.com/lettermark?c=1idN1Q_QikZtdcPcryr'
    }
  },

  perform: (request, { payload }) => {
    if (!isValidSlackUrl(payload.url)) {
      throw new IntegrationError('Invalid Slack URL', 'Bad Request', 400)
    } else {
      return request(payload.url, {
        method: 'post',
        json: {
          channel: payload.channel,
          text: payload.text,
          username: payload.username,
          icon_url: payload.icon_url
        }
      })
    }
  }
}

export default action
