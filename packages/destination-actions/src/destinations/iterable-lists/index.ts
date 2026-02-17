import { IntegrationError, AudienceDestinationDefinition, defaultValues } from '@segment/actions-core'
import type { AudienceSettings, Settings } from './generated-types'
import syncAudience from './syncAudience'
import { getAudienceByName, getAudienceByID, createAudience } from './functions'
import { CONSTANTS } from './constants'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Iterable Lists',
  slug: 'actions-iterable-lists',
  mode: 'cloud',
  description: 'Sync Segment Engage audiences to Iterable Lists',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        description:
          "To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.",
        required: true
      },
      iterableProjectType: {
        type: 'string',
        label: 'Iterable Project Type',
        description:
          'Select the type of your Iterable project. Hybrid projects support both email and user ID based identification, while User ID-Based projects only support user ID based identification.',
        choices: [
          { label: 'Hybrid Project', value: CONSTANTS.HYBRID_PROJECT_TYPE },
          { label: 'User ID-Based Project', value: CONSTANTS.USER_ID_PROJECT_TYPE }
        ],
        default: CONSTANTS.HYBRID_PROJECT_TYPE
      }
    },
    testAuthentication: (request, { settings }) => {
      const { apiKey } = settings
      return request('https://api.iterable.com/api/lists', {
        method: 'GET',
        skipResponseCloning: true,
        headers: { 'Api-Key': apiKey }
      })
    }
  },
  audienceFields: {
    updateExistingUsersOnly: {
      label: 'Update existing users only',
      description:
        'When true, Iterable ignores requests for unknown userIds and email addresses. This field is only relevant for non-email based Iterable projects: For email-based projects users will continue to be created in Iterable if a user is added or removed from a List.',
      type: 'boolean',
      default: false,
      required: false
    },
    globalUnsubscribe: {
      label: 'Channel Unsubscribe',
      description:
        "Unsubscribe email from list's associated channel - essentially a global unsubscribe. Only valid when unsubscribing a user from a List.",
      type: 'boolean',
      default: false,
      required: false
    },
    campaignId: {
      label: 'Campaign ID',
      description:
        'The numeric Campaign ID to associate with the unsubscribe. Only valid when unsubscribing a user from a List.',
      type: 'number',
      required: false
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, { settings, personas }) {
      if (!personas) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }
      if (!personas.computation_key) {
        throw new IntegrationError('Missing computation parameters: Key', 'MISSING_REQUIRED_FIELD', 422)
      }
      const audienceKey = personas.computation_key
      let externalId = await getAudienceByName(request, settings, audienceKey)
      if (externalId) {
        return { externalId }
      }
      externalId = await createAudience(request, settings, audienceKey)
      return { externalId }
    },
    async getAudience(request, { settings, externalId }) {
      const id = await getAudienceByID(request, settings, externalId)
      if (!id) {
        throw new IntegrationError(`Audience with ID ${externalId} not found in Iterable`, 'AUDIENCE_NOT_FOUND', 404)
      }
      return { externalId: id }
    }
  },
  extendRequest({ settings }) {
    const { apiKey } = settings
    return {
      headers: { 'Api-Key': apiKey }
    }
  },

  actions: {
    syncAudience
  },
  presets: [
    {
      name: 'Entities Audience Membership Changed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_audience_membership_changed_identify'
    },
    {
      name: 'Associated Entity Added',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_added_track'
    },
    {
      name: 'Associated Entity Removed',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'warehouse_entity_removed_track'
    },
    {
      name: 'Journeys Step Entered',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'specificEvent',
      eventSlug: 'journeys_step_entered_track'
    }
  ]
}
export default destination
