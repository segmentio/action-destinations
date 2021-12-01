import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import noop from 'lodash/noop'
import pkg from '../package.json'

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
      default: 'https://logo.clearbit.com/segment.com'
    }
  },

  perform: (request, { payload }) => {
    noop() // here to test bundled deps
    return request(payload.url, {
      method: 'post',
      json: {
        _version: pkg.version,
        channel: payload.channel,
        text: payload.text,
        username: payload.username,
        icon_url: payload.icon_url
      }
    })
  }
}

export default action
