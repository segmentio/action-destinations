import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TWILIO_API_VERSION } from '../../versioning-info'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send SMS',
  description: 'Sends an SMS message',
  defaultSubscription: 'type = "track"',
  fields: {
    To: {
      label: 'To',
      description: 'The Phone Number to send a SMS to',
      type: 'string',
      required: true
    },
    Body: {
      label: 'Body',
      description: 'The message body',
      type: 'text',
      required: true
    },
    MediaUrl: {
      label: 'Media URL',
      description: 'The URL of the media to send with the message.',
      type: 'string',
      required: false
    }
  },
  perform: (request, data) => {
    return request(`https://api.twilio.com/${TWILIO_API_VERSION}/Accounts/${data.settings.accountId}/Messages.json`, {
      method: 'post',
      // Fetch will automatically set the content-type for this `body`
      // to application/x-www-form-urlencoded;charset=UTF-8
      body: new URLSearchParams({
        From: data.settings.phoneNumber,
        ...data.payload
      })
    })
  }
}

export default action
