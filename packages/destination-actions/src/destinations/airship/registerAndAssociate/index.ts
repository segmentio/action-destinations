import { IntegrationError, ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { register, associate_named_user, getChannelId } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Register And Associate',
  description: 'Register an Email address and associate it with a Named User ID.',
  defaultSubscription: 'type = "track" and event="Email Address Registered"',
  fields: {
    named_user_id: {
      label: 'Airship Named User ID',
      description: 'The identifier assigned in Airship as the Named User',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    locale: {
      label: 'Locale',
      description: 'Locale includes country and language',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.locale'
      }
    },
    timezone: {
      label: 'Timezone',
      description: 'Timezone',
      type: 'string',
      required: false,
      default: {
        '@path': '$.context.timezone'
      }
    },
    opt_in_choices: {
      label: 'Registration Type',
      description: 'Classic or Double',
      type: 'string',
      default: 'classic',
      choices: [
        {
          label: 'Classic',
          value: 'classic'
        },
        {
          label: 'Double',
          value: 'double'
        }
      ]
    },
    channel_object: {
      label: 'Channel',
      description: 'Information about the email registration.',
      type: 'object',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      required: true,
      properties: {
        address: {
          label: 'Email Address',
          description: 'Email address to register (required)',
          type: 'string',
          required: true
        },
        new_address: {
          label: 'New Email Address',
          description: 'Email address to replace old one',
          type: 'string',
          required: false
        },
        commercial_opted_in: {
          label: 'Commercial Opted In Date-Time',
          description: 'The date-time when a user gave explicit permission to receive commercial emails',
          type: 'string',
          required: false
        },
        commercial_opted_out: {
          label: 'Commercial Opted Out Date-Time',
          description: 'The date-time when a user explicitly denied permission to receive commercial emails.',
          type: 'string',
          required: false
        },
        click_tracking_opted_in: {
          label: 'Click Tracking Opted in Date-Time',
          description: 'The date-time when a user opted in to click tracking.',
          type: 'string',
          required: false
        },
        click_tracking_opted_out: {
          label: 'Click Tracking Opted out Date-Time',
          description: 'The date-time when a user opted out of click tracking.',
          type: 'string',
          required: false
        },
        open_tracking_opted_in: {
          label: 'Open Tracking Opted in Date-Time',
          description: 'The date-time when a user opted in to open tracking.',
          type: 'string',
          required: false
        },
        open_tracking_opted_out: {
          label: 'Open Tracking Opted out Date-Time',
          description: 'The date-time when a user opted out of open tracking.',
          type: 'string',
          required: false
        },
        transactional_opted_in: {
          label: 'Transactional Email Opt In Date-Time',
          description:
            'The date-time when a user gave explicit permission to receive transactional emails. Users do not need to opt-in to receive transactional emails unless they have previously opted out.',
          type: 'string',
          required: false
        },
        transactional_opted_out: {
          label: 'Transactional Email Opt Out Date-Time',
          description: 'The date-time when a user explicitly denied permission to receive transactional emails.',
          type: 'string',
          required: false
        },
        suppression_state: {
          label: 'Suppression State',
          description:
            'If an email channel is suppressed, the reason for its suppression. Email channels with any suppression state set will not have any delivery to them fulfilled. If a more specific reason is not known, use imported. Possible values: spam_complaint, bounce, imported',
          type: 'string',
          required: false
        }
      },
      default: {
        address: { '@path': '$.properties.email' },
        new_address: { '@path': '$.properties.new_email' },
        commercial_opted_in: { '@path': '$.properties.commercial_opted_in' },
        commercial_opted_out: { '@path': '$.properties.commercial_opted_out' },
        click_tracking_opted_in: { '@path': '$.properties.click_tracking_opted_in' },
        click_tracking_opted_out: { '@path': '$.properties.click_tracking_opted_out' },
        open_tracking_opted_in: { '@path': '$.properties.open_tracking_opted_in' },
        open_tracking_opted_out: { '@path': '$.properties.open_tracking_opted_out' },
        transactional_opted_in: { '@path': '$.properties.transactional_opted_in' },
        transactional_opted_out: { '@path': '$.properties.transactional_opted_out' },
        suppression_state: { '@path': '$.context.suppression_state' }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    if (payload.channel_object.new_address) {
      const old_email_channel_response = await getChannelId(request, settings, payload.channel_object.address)
      const old_email_response_content: any = JSON.parse(old_email_channel_response.content)
      if (old_email_response_content.channel.channel_id) {
        return await register(request, settings, payload, old_email_response_content.channel.channel_id)
      }
    }
    const register_response = await register(request, settings, payload, null)
    const response_content = register_response.content
    const data = JSON.parse(response_content)

    if (!data.ok || !data.channel_id) {
      throw new IntegrationError(
        `Registration Failed, didn't create channel_id for ${payload.channel_object.address}`,
        'Unsuccessful Registration',
        400
      )
    }
    const channel_id = data.channel_id
    if (payload.named_user_id && payload.named_user_id.length > 0) {
      const associate_response = await associate_named_user(request, settings, channel_id, payload.named_user_id)
      if (!associate_response.ok) {
        throw new IntegrationError(
          `Associate Failed for named user ${payload.named_user_id}`,
          'Could not associate email address with named user id',
          400
        )
      }
      return associate_response
    } else {
      return data
    }
  }
}

export default action
