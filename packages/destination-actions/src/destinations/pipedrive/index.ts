import createUpdateOrganization from './createUpdateOrganization'
import createUpdatePerson from './createUpdatePerson'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createUpdateActivity from './createUpdateActivity'

import createUpdateDeal from './createUpdateDeal'

import createUpdateLead from './createUpdateLead'

import createUpdateNote from './createUpdateNote'

const destination: DestinationDefinition<Settings> = {
  name: 'Actions Pipedrive',
  slug: 'actions-pipedrive',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      domain: {
        label: 'Domain',
        description: 'Pipedrive domain. This is found in Pipedrive in Settings > Company settings > Company domain.',
        type: 'string',
        // minLength: 1,
        required: true
      },
      apiToken: {
        label: 'API Token',
        description:
          'Pipedrive API token. This is found in Pipedrive in Settings > Personal preferences > API > Your personal API token.',
        type: 'string',
        // minLength: 20,
        required: true
      },
      personField: {
        label: 'External ID field for a Person in Pipedrive',
        description:
          'This is a key by which a Person in Pipedrive will be searched. It can be either Person id or has of a custom field containing external id. Default value is `person_id`.',
        type: 'string',
        default: 'id',
        required: false
      },
      organizationField: {
        label: 'External ID field for an Organization in Pipedrive',
        description:
          'This is a key by which an Organization in Pipedrive will be searched. It can be either Organization id or has of a custom field containing external id. Default value is `org_id`.',
        type: 'string',
        default: 'id',
        required: false
      },
      dealField: {
        label: 'External ID field for a Deal in Pipedrive',
        description:
          'This is a key by which a Deal in Pipedrive will be searched. It can be either Deal id or has of a custom field containing external id. Default value is `deal_id`.',
        type: 'string',
        default: 'id',
        required: false
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://${settings.domain}.pipedrive.com/api/v1/users/me`)
    }
  },

  extendRequest({ settings }) {
    return {
      searchParams: {
        api_token: settings.apiToken
      }
    }
  },

  actions: {
    createUpdateOrganization,
    createUpdatePerson,
    createUpdateActivity,
    createUpdateDeal,
    createUpdateLead,
    createUpdateNote
  },
  presets: [
    {
      name: 'Create or Update a Person',
      subscribe: 'type = "identify"',
      partnerAction: 'createUpdatePerson',
      mapping: defaultValues(createUpdatePerson.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update an Organization',
      subscribe: 'type = "group"',
      partnerAction: 'createUpdateOrganization',
      mapping: defaultValues(createUpdateOrganization.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update an Activity',
      subscribe: 'type = "track" and event = "Activity Upserted"',
      partnerAction: 'createUpdateActivity',
      mapping: defaultValues(createUpdateActivity.fields),
      type: 'automatic'
    }
  ]
}

export default destination
