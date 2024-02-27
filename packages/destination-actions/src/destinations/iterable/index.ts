import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import updateUser from './updateUser'
import trackEvent from './trackEvent'
import updateCart from './updateCart'
import trackPurchase from './trackPurchase'
import { DataCenterLocation } from './shared-fields'
import { getRegionalEndpoint } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Iterable (Actions)',
  slug: 'actions-iterable',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description:
          "To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.",
        required: true
      },
      dataCenterLocation: {
        label: 'Data Center Location',
        description: 'The location where your Iterable data is hosted.',
        type: 'string',
        format: 'text',
        choices: [
          {
            label: 'United States',
            value: 'united_states'
          },
          {
            label: 'Europe',
            value: 'europe'
          }
        ],
        default: 'united_states'
      }
    },
    testAuthentication: (request, { settings }) => {
      const endpoint = getRegionalEndpoint('getWebhooks', settings.dataCenterLocation as DataCenterLocation)
      return request(endpoint, {
        method: 'get',
        headers: { 'Api-Key': settings.apiKey }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'Api-Key': settings.apiKey }
    }
  },
  actions: {
    updateUser,
    trackEvent,
    updateCart,
    trackPurchase
  },
  presets: [
    {
      name: 'Track Calls',
      subscribe: 'type = "track" and event != "Order Completed" and event != "Cart Updated"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Calls',
      subscribe: 'type = "identify"',
      partnerAction: 'updateUser',
      mapping: defaultValues(updateUser.fields),
      type: 'automatic'
    },
    {
      name: 'Update Cart Calls',
      subscribe: 'type = "track" and event = "Cart Updated"',
      partnerAction: 'updateCart',
      mapping: defaultValues(updateCart.fields),
      type: 'automatic'
    },
    {
      name: 'Order Completed Calls',
      subscribe: 'type = "track" and event = "Order Completed"',
      partnerAction: 'trackPurchase',
      mapping: defaultValues(trackPurchase.fields),
      type: 'automatic'
    },
    {
      name: 'Associated Entity Added',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        dataFields: {
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
        dataFields: {
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
        dataFields: {
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
        dataFields: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'updateUser',
      mapping: {
        ...defaultValues(updateUser.fields),
        dataFields: {
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
        dataFields: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}

export default destination
