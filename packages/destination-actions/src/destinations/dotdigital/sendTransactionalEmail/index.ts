import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDEmailApi } from '../api'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Transactional Email',
  description: 'Sends a transactional email.',
  defaultSubscription: 'type = "track" and event = "Send Transactional Email"',
  fields: {
    fromAddress: {
      label: 'From Address',
      description:
        'Use either your default transactional email from address, or another custom from address you have added to your account. If you set a from address that is not listed in your available from addresses, Dotdigital will replace it with your default from address. You may set a from name as well as an email address, for example "My Company <`Dotmailer123@r1.dotdigital-email.com`>". [Read more about using transactional email](https://support.dotdigital.com/en/articles/8199068-use-transactional-email).',
      type: 'string',
      required: true
    },
    toAddresses: {
      label: 'To Address',
      description: 'The email address(es) to send to.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      required: true
    },
    subject: {
      label: 'Subject',
      description: 'The subject line for your email.',
      type: 'string',
      required: true
    },
    htmlContent: {
      description: 'The HTML content for your email.',
      label: 'HTML Content',
      type: 'text',
      required: true
    },
    plainTextContent: {
      label: 'Plain Text Content',
      description: 'The plain text content for your email.',
      type: 'text',
      required: false
    },
    ccAddresses: {
      label: 'CC Addresses',
      description: 'The CC email address(es) to send to. Separate email addresses with a comma. Maximum: 100.',
      type: 'string',
      required: false
    },
    bccAddresses: {
      label: 'BCC Addresses',
      description: 'The BCC email address(es) to send to. Separate email addresses with a comma. Maximum: 100.',
      type: 'string',
      required: false
    }
  },
  perform: async (request, { settings, payload }) => {
    const emailApi = new DDEmailApi(settings, request)
    return await emailApi.sendTransactionalEmail(payload)
  }
}

export default action
