import { URLSearchParams } from 'url'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
    }
  },
  perform: (request, data) => {
    return request(`https://api.twilio.com/2010-04-01/Accounts/${data.settings.accountId}/Messages.json`, {
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
