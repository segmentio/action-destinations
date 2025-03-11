import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import customEvents from './customEvents' // Existing action for custom events
import customAttributes from './customAttributes' // Existing action for custom attributes
import subscribers from './subscribers' // New action for managing subscribers

const destination: DestinationDefinition<Settings> = {
  name: 'Attentive',
  slug: 'actions-attentive', // Keep default slug
  mode: 'cloud',
  description: 'Send Segment analytics events, custom attributes, and manage subscriber subscriptions in Attentive.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Attentive API Key.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request('https://api.attentivemobile.com/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    customEvents, // Send analytics events to Attentive
    customAttributes, // Send custom attributes to Attentive
    subscribers // Manage subscriber subscriptions
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'customEvents',
      mapping: defaultValues(customEvents.fields),
      type: 'automatic'
    },
    {
      name: 'Track Custom Attributes',
      subscribe: 'type = "identify"', // Trigger custom attributes on identify events
      partnerAction: 'customAttributes',
      mapping: defaultValues(customAttributes.fields),
      type: 'automatic'
    },
    {
      name: 'Subscribe User',
      subscribe: 'type = "identify" and traits.phone != null', // Trigger on identify with `subscribed: true`
      partnerAction: 'subscribers',
      mapping: defaultValues(subscribers.fields),
      type: 'automatic'
    }
  ]
}

export default destination
