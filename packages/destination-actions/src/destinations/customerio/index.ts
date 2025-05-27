import { defaultValues } from '@segment/actions-core'
import createUpdateDevice from './createUpdateDevice'
import createUpdateObject from './createUpdateObject'
import createUpdatePerson from './createUpdatePerson'
import deleteDevice from './deleteDevice'
import deleteRelationship from './deleteRelationship'
import deleteObject from './deleteObject'
import deletePerson from './deletePerson'
import mergePeople from './mergePeople'
import reportDeliveryEvent from './reportDeliveryEvent'
import reportContentEvent from './reportContentEvent'
import suppressPerson from './suppressPerson'
import unsuppressPerson from './unsuppressPerson'
import trackEvent from './trackEvent'
import trackPageView from './trackPageView'
import trackScreenView from './trackScreenView'
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { AccountRegion, trackApiEndpoint } from './utils'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Customerio',
  slug: 'actions-customerio',
  mode: 'cloud',
  authentication: {
    scheme: 'basic',
    fields: {
      siteId: {
        description:
          'Customer.io site ID. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
        label: 'Site ID',
        type: 'password',
        required: true
      },
      apiKey: {
        description:
          'Customer.io API key. This can be found on your [API Credentials page](https://fly.customer.io/settings/api_credentials).',
        label: 'API Key',
        type: 'password',
        required: true
      },
      accountRegion: {
        description: 'Learn about [Account Regions](https://customer.io/docs/data-centers/).',
        label: 'Account Region',
        type: 'string',
        choices: Object.values(AccountRegion).map((dc) => ({ label: dc, value: dc })),
        default: AccountRegion.US
      }
    },
    testAuthentication: (request) => {
      return request('https://track.customer.io/auth')
    }
  },

  extendRequest({ settings }) {
    return {
      username: settings.siteId,
      password: settings.apiKey
    }
  },

  actions: {
    createUpdateDevice,
    deleteDevice,
    deleteRelationship,
    deletePerson,
    deleteObject,
    createUpdatePerson,
    trackEvent,
    trackPageView,
    trackScreenView,
    createUpdateObject,
    mergePeople,
    suppressPerson,
    unsuppressPerson,
    reportDeliveryEvent,
    reportContentEvent
  },

  presets: [
    {
      name: 'Create or Update Person',
      subscribe: 'type = "identify"',
      partnerAction: 'createUpdatePerson',
      mapping: defaultValues(createUpdatePerson.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update Device',
      subscribe: 'event = "Application Installed" or event = "Application Opened"',
      partnerAction: 'createUpdateDevice',
      mapping: defaultValues(createUpdateDevice.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: `
        type = "track"
        and event != "Relationship Deleted"
        and event != "User Deleted"
        and event != "User Suppressed"
        and event != "User Unsuppressed"
        and event != "Object Deleted"
        and event != "Report Delivery Event"
        and event != "Report Content Event"
      `,
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'trackPageView',
      mapping: defaultValues(trackPageView.fields),
      type: 'automatic'
    },
    {
      name: 'Track Screen View',
      subscribe: 'type = "screen"',
      partnerAction: 'trackScreenView',
      mapping: defaultValues(trackScreenView.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update Object',
      subscribe: 'type = "group"',
      partnerAction: 'createUpdateObject',
      mapping: defaultValues(createUpdateObject.fields),
      type: 'automatic'
    },
    {
      name: 'Report Delivery Event',
      subscribe: 'event = "Report Delivery Event"',
      partnerAction: 'reportDeliveryEvent',
      mapping: defaultValues(reportDeliveryEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Report Content Event',
      subscribe: 'event = "Report Content Event"',
      partnerAction: 'reportContentEvent',
      mapping: defaultValues(reportContentEvent.fields),
      type: 'automatic',
    },
    {
      name: 'Associated Entity Added',
      partnerAction: 'trackEvent',
      mapping: {
        ...defaultValues(trackEvent.fields),
        data: {
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
        data: {
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
        data: {
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
        data: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_exited_track'
    },
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'createUpdatePerson',
      mapping: {
        ...defaultValues(createUpdatePerson.fields),
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
        data: {
          '@path': '$.properties'
        }
      },
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ],

  onDelete(request, { settings, payload }) {
    const { userId } = payload

    const url = `${trackApiEndpoint(settings)}/api/v1/customers/${userId}`

    return request(url, {
      method: 'DELETE'
    })
  }
}

export default destination
