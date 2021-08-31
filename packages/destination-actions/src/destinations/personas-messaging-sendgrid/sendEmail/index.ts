import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import Mustache from 'mustache'
const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Sends Email to a user powered by SendGrid',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      default: { '@path': '$.userId' }
    },
    fromEmail: {
      label: 'From Email',
      description: 'From Email',
      type: 'string',
      required: true
    },
    fromName: {
      label: 'From Name',
      description: 'From Name displayed to end user email',
      type: 'string',
      required: true
    },
    body: {
      label: 'Body',
      description: 'The message body',
      type: 'text',
      required: true
    },
    subject: {
      label: 'Subject',
      description: 'Subject for the email to be sent',
      type: 'string',
      required: true
    },
    spaceId: {
      label: 'Space ID',
      description: 'Your Profile API Space ID',
      type: 'string',
      required: true,
      default: { '@path': '$.context.personas.space_id' }
    },
    sourceId: {
      label: 'Source ID',
      description: 'The ID of your Source',
      type: 'string',
      required: true
    },
    profile: {
      label: 'Profile Properties',
      description: 'The Profile/Traits Properties',
      type: 'object',
      required: true
    },
    bodyType: {
      label: 'Body Type',
      description: 'The type of body which is used generally html | design',
      type: 'string',
      required: true
    },
    bodyHtml: {
      label: 'Body Html',
      description: 'The HTML content of the body',
      type: 'string',
      required: true
    },
    replyToEmail: {
      label: 'Reply To Email',
      description: 'The Email used by user to Reply To',
      type: 'string',
      required: true
    },
    replyToName: {
      label: 'Reply To Name',
      description: 'The Name used by user to Reply To',
      type: 'string',
      required: true
    },
    bcc: {
      label: 'BCC',
      description: 'BCC list of emails',
      type: 'string',
      required: true
    }
  },
  perform: async (request, { payload }) => {
    const profile = payload.profile
    if (!profile.email) {
      return
    }
    let name
    if (profile.first_name && profile.last_name) {
      name = `${profile.first_name} ${profile.last_name}`
    } else if (profile.firstName && profile.lastName) {
      name = `${profile.firstName} ${profile.lastName}`
    } else if (profile.name) {
      name = profile.name
    } else {
      name = profile.first_name || profile.last_name || profile.firstName || profile.lastName || 'User'
    }
    return request('https://api.sendgrid.com/v3/mail/send', {
      method: 'post',
      json: {
        personalizations: [
          {
            to: [
              {
                email: profile.email,
                name: name
              }
            ],
            bcc: JSON.parse(payload.bcc || '[]'),
            custom_args: {
              source_id: payload.sourceId ? payload.sourceId : '',
              space_id: payload.spaceId ? payload.spaceId : '',
              user_id: payload.userId
            }
          }
        ],

        from: {
          email: payload.fromEmail,
          name: payload.fromName
        },
        reply_to: {
          email: payload.replyToEmail,
          name: payload.replyToName
        },
        subject: Mustache.render(payload.subject, profile),
        content: [
          {
            type: 'text/html',
            value: Mustache.render(payload.body, profile)
          }
        ]
      }
    })
  }
}

export default action
