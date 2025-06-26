import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DDCpaasApi } from '../api'
import { CpaasMessageBody } from '../api/types'
import { checkAndCleanMobileNumber } from '../helpers/functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Transactional SMS',
  description: 'Sends a transactional SMS.',
  defaultSubscription: 'type = "track" and event = "Send Transactional SMS"',
  fields: {
    to: {
      label: 'To',
      description: 'Only valid mobile numbers with an international dialling prefix will be accepted (e.g. 447777123123).',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.phone' },
          then: { '@path': '$.traits.phone' },
          else: { '@path': '$.properties.phone' }
        }
      }
    },
    from: {
      label: 'From',
      description: 'Enter a custom From name, or leave blank to use a random number. From name format varies by region. [Learn more](https://support.dotdigital.com/en/articles/8199187-sender-ids-and-originators)',
      type: 'string',
      required: false,
    },
    message: {
      label: 'Message',
      description: 'The content of the SMS, up to 160 non-encoded characters per message.',
      type: 'text',
      required: true,
    },
    link_shortening: {
      label: 'Link Shortening',
      description: '[Link shortening](https://developer.dotdigital.com/v2/reference/additional-options#link-shortening) will automatically shorten your links to save character count and track who clicked on them for better reporting. Defaults to No.',
      default: false,
      type: 'boolean',
      required: false,
    },
    allow_unicode: {
      label: 'Allow Unicode Characters',
      description: 'If Yes, Unicode characters will be allowed in the message body. If No, any messages containing Unicode will not be sent. Please [read why Unicode](https://developer.dotdigital.com/reference/channel-sms#section-why-is-unicode-important-with-sms) is important before switching this on. Defaults to No.',
      default: false,
      type: 'boolean',
      required: false,
    },
  },
  perform: (request, { settings, payload }) => {
    const { to, from, message, link_shortening, allow_unicode } = payload

    const body: CpaasMessageBody = {
      to: {
        phoneNumber: checkAndCleanMobileNumber(to)
      },
      body: message,
      rules: ['sms'],
    }

    if (from || allow_unicode) {
      body.channelOptions = { sms: {} }

      if (from) {
        body.channelOptions.sms.from = from
      }

      if (allow_unicode) {
        body.channelOptions.sms.allowUnicode = allow_unicode
      }
    }

    if (link_shortening) {
      body.shortenLinks = 'on'
    }

    const cpaasApi = new DDCpaasApi(settings, request)
    return cpaasApi.sendTransactionalSms(body)
  }
}

export default action
