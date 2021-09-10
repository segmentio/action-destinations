import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendSms from './sendSms'

const destination: DestinationDefinition<Settings> = {
  //The name below is creation name however in partner portal this is Actions Personas Messaging Twilio
  //This is due to integrations-consumer fetches the creation name instead of current name
  name: 'Personas Messaging Twilio (Actions)',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      twilioAccountId: {
        label: 'Twilio Account ID',
        description: 'Twilio Account ID',
        type: 'string',
        required: true
      },
      twilioAuthToken: {
        label: 'Twilio Auth Token',
        description: 'Twilio Auth Token',
        type: 'password',
        required: true
      },
      profileApiEnvironment: {
        label: 'Profile API Environment',
        description: 'Profile API Environment',
        type: 'string',
        required: true
      },
      profileApiAccessToken: {
        label: 'Profile API Access Token',
        description: 'Profile API Access Token',
        type: 'password',
        required: true
      },
      spaceId: {
        label: 'Space ID',
        description: 'Space ID',
        type: 'string',
        required: true
      },
      sourceId: {
        label: 'Source ID',
        description: 'Source ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.twilio.com/2010-04-01')
    }
  },
  // TODO: GROW-259 we'll uncomment this once we remove the calls to the profiles API,
  // but for now this would extend those requests and result in 401s
  // extendRequest: ({ settings }) => {
  //   return {
  //     username: settings.twilioAccountId,
  //     password: settings.twilioAuthToken
  //   }
  // },
  actions: {
    sendSms
  }
}

export default destination
