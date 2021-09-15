import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import updateUserProfile from './updateUserProfile'
import trackEvent from './trackEvent'
import trackPurchase from './trackPurchase'

const destination: DestinationDefinition<Settings> = {
  name: 'Braze Cloud Mode',
  slug: 'actions-braze-cloud',
  mode: 'cloud',
  description: 'Send events server-side to the Braze REST API.',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Created under Developer Console in the Braze Dashboard.',
        type: 'password',
        required: true
      },
      app_id: {
        label: 'App ID',
        description:
          'The app identifier used to reference specific Apps in requests made to the Braze API. Created under Developer Console in the Braze Dashboard.',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'REST Endpoint',
        description: 'Your Braze REST endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints)',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'US-01	(https://dashboard-01.braze.com)', value: 'https://rest.iad-01.braze.com' },
          { label: 'US-02	(https://dashboard-02.braze.com)', value: 'https://rest.iad-02.braze.com' },
          { label: 'US-03	(https://dashboard-03.braze.com)', value: 'https://rest.iad-03.braze.com' },
          { label: 'US-04	(https://dashboard-04.braze.com)', value: 'https://rest.iad-04.braze.com' },
          { label: 'US-05	(https://dashboard-05.braze.com)', value: 'https://rest.iad-05.braze.com' },
          { label: 'US-06	(https://dashboard-06.braze.com)', value: 'https://rest.iad-06.braze.com' },
          { label: 'US-08	(https://dashboard-08.braze.com)', value: 'https://rest.iad-08.braze.com' },
          { label: 'EU-01	(https://dashboard-01.braze.eu)', value: 'https://rest.fra-01.braze.eu' }
        ],
        default: 'https://rest.iad-01.braze.com',
        required: true
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      }
    }
  },
  actions: {
    updateUserProfile,
    trackEvent,
    trackPurchase
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track" and event != "Order Completed"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Order Completed Calls',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'trackPurchase',
      mapping: defaultValues(trackPurchase.fields)
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'updateUserProfile',
      mapping: defaultValues(updateUserProfile.fields)
    }
  ]
}

export default destination
