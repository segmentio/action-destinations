import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email',
  description: 'Sends Email to a user powered by SendGrid',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    userId: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    from: {
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
    to: {
      label: 'To Email',
      description: 'The Email Address to send an email to',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.email' }
    },
    toName: {
      label: 'To Name',
      description: 'The Name of the user to send an email',
      type: 'string',
      required: true,
      default: { '@path': '$.properties.first_name' }
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
      default: { '@path': '$.context.personas.space_id' }
    },
    sourceId: {
      label: 'Source ID',
      description: 'The ID of your Source',
      type: 'string'
    }
  },
  perform: async (request, { payload }) => {
    return request('https://api.sendgrid.com/v3/mail/send', {
      method: 'post',
      json: {
        personalizations: [
          {
            to: [
              {
                email: payload.to,
                name: payload.toName
              }
            ],
            custom_args: {
              source_id: payload.sourceId ? payload.sourceId : '',
              space_id: payload.spaceId ? payload.spaceId : '',
              user_id: payload.userId
            }
          }
        ],

        from: {
          email: payload.from,
          name: payload.fromName
        },
        subject: payload.subject,
        content: [
          {
            type: 'text/html',
            value: payload.body
          }
        ]
      }
    })
  }
}

export default action
