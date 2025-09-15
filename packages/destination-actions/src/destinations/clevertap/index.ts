import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import userUpload from './userUpload'

import userDelete from './userDelete'
import { defaultValues } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'CleverTap (Actions)',
  slug: 'actions-clevertap',
  mode: 'cloud',
  description:
    'CleverTap is a customer engagement and retention platform that provides the functionality to integrate app analytics and marketing. The platform helps customers increase user engagement in three ways:' +
    ' 1) Tracks actions users are taking and analyzes how people use the product.' +
    ' 2) [Segment](https://docs.clevertap.com/docs/segments) users based on their actions and run targeted [campaigns](https://docs.clevertap.com/docs/intro-to-campaigns) to these  segments.' +
    ' 3) [Analyze](https://docs.clevertap.com/docs/intro-to-reports) each campaign to understand its effect on user engagement and business metrics',
  authentication: {
    scheme: 'custom',
    fields: {
      clevertapAccountId: {
        label: 'CleverTap Account ID',
        description:
          'CleverTap Account Id. This can be found under [Settings Page](https://developer.clevertap.com/docs/authentication#getting-your-account-credentials).',
        type: 'string',
        required: true
      },
      clevertapPasscode: {
        label: 'CleverTap Account Passcode',
        description:
          'CleverTap Passcode. This can be found under [Settings Page](https://developer.clevertap.com/docs/authentication#getting-your-account-credentials).',
        type: 'string',
        required: true
      },
      clevertapEndpoint: {
        label: 'REST Endpoint',
        description:
          'Learn More about [Account regions](https://docs.clevertap.com/docs/build-segment-destination#set-up-segment-destination-action).',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'SK', value: 'https://sk1.api.clevertap.com' },
          { label: 'EU', value: 'https://eu1.api.clevertap.com' },
          { label: 'US', value: 'https://us1.api.clevertap.com' },
          { label: 'SG', value: 'https://sg1.api.clevertap.com' },
          { label: 'IN', value: 'https://in1.api.clevertap.com' }
        ],
        default: 'https://sk1.api.clevertap.com',
        required: true
      }
    }
  },

  actions: {
    userUpload,
    userDelete
  },
  presets: [
    {
      name: 'Event Name is Delete User',
      subscribe: 'event = "Delete User"',
      partnerAction: 'userDelete',
      mapping: defaultValues(userDelete.fields),
      type: 'automatic'
    },
    {
      name: 'Event Type is Identify',
      subscribe: 'type = "identify"',
      partnerAction: 'userUpload',
      mapping: defaultValues(userUpload.fields),
      type: 'automatic'
    }
  ]
}

export default destination
