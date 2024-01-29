import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { register, associate_named_user, getChannelId, EMAIL, SMS } from '../utilities'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Register And Associate',
  description: 'Register an Email address or SMS number and associate it with a Named User ID.',
  defaultSubscription: 'type = "track" and event="Address Registered"',
  fields: {
    channel_type: {
      label: 'Channel Type',
      description: 'Email (default) or SMS',
      type: 'string',
      choices: [
        { label: 'Email', value: EMAIL },
        { label: 'SMS', value: SMS }
      ],
      default: EMAIL,
      required: false
    },
    sms_sender: {
      label: 'SMS Sender',
      description: 'A long or short code the app is configured to send from (if using for SMS).',
      type: 'string',
      required: false
    },
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
          label: 'Email Address or MSISDN',
          description: 'Email address or mobile number to register (required)',
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
        },
        sms_opted_in: {
          label: 'SMS Opt In Date-Time',
          description: 'The date-time when a user gave explicit permission to receive SMS messages.',
          type: 'string',
          required: false
        }
      },
      default: {
        address: { '@path': '$.properties.address' },
        new_address: { '@path': '$.properties.new_email' },
        commercial_opted_in: { '@path': '$.properties.commercial_opted_in' },
        commercial_opted_out: { '@path': '$.properties.commercial_opted_out' },
        click_tracking_opted_in: { '@path': '$.properties.click_tracking_opted_in' },
        click_tracking_opted_out: { '@path': '$.properties.click_tracking_opted_out' },
        open_tracking_opted_in: { '@path': '$.properties.open_tracking_opted_in' },
        open_tracking_opted_out: { '@path': '$.properties.open_tracking_opted_out' },
        transactional_opted_in: { '@path': '$.properties.transactional_opted_in' },
        transactional_opted_out: { '@path': '$.properties.transactional_opted_out' },
        suppression_state: { '@path': '$.context.suppression_state' },
        sms_opted_in: { '@path': '$.properties.sms_opted_in' }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    if (payload.channel_object.new_address && payload.channel_object.address) {
      const old_email_channel_response = await getChannelId(request, settings, payload.channel_object.address)
      if (!old_email_channel_response.ok) {
        // Couldn't find the old email address or some other error,
        // so returning the request for Segment to handle as per policy
        return old_email_channel_response
      }
      const old_email_response_content: any = JSON.parse(old_email_channel_response.content)
      if (old_email_response_content.channel.channel_id) {
        // Using the channel id of the old email address to replace it with the new one and then we're done
        // We explicitly don't want to continue to the association step, as the assumption is that the
        // original email was already associated with a Named User
        return await register(request, settings, payload, old_email_response_content.channel.channel_id)
      }
    }
    const register_response = await register(request, settings, payload, null)
    // If we get to this point, we're registering a new email address
    if (!register_response.ok) {
      // Failed the registration, so returning the request for Segment to handle as per policy
      return register_response
    }

    const response_content = register_response.content
    const data = JSON.parse(response_content)

    const channel_id = data.channel_id
    let channel_type = EMAIL.toLowerCase()
    if (payload.channel_type) {
      channel_type = payload.channel_type.toLowerCase()
    }
    if (payload.named_user_id && payload.named_user_id.length > 0) {
      // If there's a Named User ID to associate with the address, do it here
      return await associate_named_user(request, settings, channel_id, payload.named_user_id, channel_type)
    } else {
      // If not, simply return the registration request, success or failure, for Segment to handle as per policy
      return register_response
    }
  }
}

export default action
