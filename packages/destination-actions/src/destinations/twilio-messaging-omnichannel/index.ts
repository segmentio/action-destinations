import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendMessage from './sendMessage'

const destination: DestinationDefinition<Settings> = {
  name: 'Twilio Messaging',
  slug: 'actions-twilio-messaging-omnichannel',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      username: {
        label: 'Twilio Account SID.',
        description:
          'Twilio Account SID. This can be found in the [Twilio Console](https://www.twilio.com/docs/usage/api#authenticate-with-http:~:text=token%20in%20the-,Twilio%20Console,-after%20signing%20up).',
        type: 'string',
        required: true
      },
      password: {
        label: 'AUTH Token',
        description:
          'AUTH Token. This can be found in the [Twilio Console](https://www.twilio.com/docs/usage/api#authenticate-with-http:~:text=token%20in%20the-,Twilio%20Console,-after%20signing%20up).',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`https://api.twilio.com/2010-04-01`)
    }
  },

  extendRequest({ settings }) {
    return {
      'Content-Type': 'application/json',
      username: settings.username,
      password: settings.password
    }
  },

  actions: {
    sendMessage
  }
}

export default destination
