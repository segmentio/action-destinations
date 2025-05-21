import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_REQUEST_TIMEOUT, defaultValues } from '@segment/actions-core'
import createAlias from './createAlias'
import createAlias2 from './createAlias2'
import identifyUser from './identifyUser'
import identifyUser2 from './identifyUser2'
import trackEvent from './trackEvent'
import trackPurchase from './trackPurchase'
import updateUserProfile from './updateUserProfile'
import trackEvent2 from './trackEvent2'
import trackPurchase2 from './trackPurchase2'
import updateUserProfile2 from './updateUserProfile2'

const destination: DestinationDefinition<Settings> = {
  name: 'Braze Cloud Mode (Actions)',
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
        type: 'string'
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
          { label: 'US-07	(https://dashboard-07.braze.com)', value: 'https://rest.iad-07.braze.com' },
          { label: 'US-08	(https://dashboard-08.braze.com)', value: 'https://rest.iad-08.braze.com' },
          { label: 'US-09	(https://dashboard-09.braze.com)', value: 'https://rest.iad-09.braze.com' },
          { label: 'US-10	(https://dashboard-10.braze.com)', value: 'https://rest.iad-10.braze.com' },
          { label: 'EU-01	(https://dashboard-01.braze.eu)', value: 'https://rest.fra-01.braze.eu' },
          { label: 'EU-02	(https://dashboard-02.braze.eu)', value: 'https://rest.fra-02.braze.eu' },
          { label: 'AU-01 (https://dashboard.au-01.braze.com)', value: 'https://rest.au-01.braze.com' },
          { label: 'ID-01 (https://dashboard.id-01.braze.com)', value: 'https://rest.id-01.braze.com' }
        ],
        default: 'https://rest.iad-01.braze.com',
        required: true
      }
    }
  },
  onDelete: async (request, { payload, settings }) => {
    return request(`${settings.endpoint}/users/delete`, {
      method: 'post',
      json: {
        external_ids: [payload.userId]
      }
    })
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      },
      timeout: Math.max(30_000, DEFAULT_REQUEST_TIMEOUT)
    }
  },
  actions: {
    updateUserProfile,
    trackEvent,
    trackPurchase,
    createAlias,
    identifyUser,
    identifyUser2,
    trackEvent2,
    trackPurchase2,
    updateUserProfile2,
    createAlias2
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track" and event != "Order Completed"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Order Completed Calls',
      subscribe: 'event = "Order Completed"',
      partnerAction: 'trackPurchase',
      mapping: defaultValues(trackPurchase.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'updateUserProfile',
      mapping: defaultValues(updateUserProfile.fields),
      type: 'automatic'
    },
    {
      name: 'Associated Entity Added',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        properties: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        properties: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Entities Audience Entered',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        properties: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_entered_track'
    },
    {
      name: 'Entities Exited',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        properties: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'updateUserProfile',
      mapping: {
        ...defaultValues(updateUserProfile.fields),
        custom_attributes: {
          '@path': '$.traits'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Journeys Step Transition Track',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        properties: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
