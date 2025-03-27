import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import { enchargeRestAPIBase } from './utils'
import { deleteUser } from './deleteUser'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import trackPageView from './trackPageView'
import aliasUser from './aliasUser'
import createUpdateObject from './createUpdateObject'

import addTag from './addTag'

import removeTag from './removeTag'

const destination: DestinationDefinition<Settings> = {
  name: 'Encharge (Actions)',
  slug: 'encharge-cloud-actions',
  mode: 'cloud',

  authentication: {
    /// @ts-ignore - falsely recongized as a "oauth-managed" for some reason
    scheme: 'custom',
    fields: {
      apiKey: {
        description:
          'Encharge.io API Key. This can be found on your [Account page](https://app.encharge.io/settings/api-keys).',
        label: 'API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${enchargeRestAPIBase}/v1/accounts/info`)
    }
  },
  extendRequest: ({ settings }: { settings: Settings }) => {
    return {
      headers: {
        'X-Encharge-Token': settings.apiKey,
        'Content-Type': 'application/json',
        'X-Segment-Actions': '1'
      }
    }
  },
  onDelete: deleteUser,
  description:
    'Encharge is a marketing automation platform that enables B2B SaaS companies to automate their marketing processes to increase customer engagement, retention, and revenue.',
  presets: [
    {
      partnerAction: 'trackEvent',
      name: 'Track Event',
      subscribe: 'type = "track"',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      partnerAction: 'identifyUser',
      name: 'Identify User',
      subscribe: 'type = "identify"',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      partnerAction: 'trackPageView',
      name: 'Track Page View',
      subscribe: 'type = "page"',
      mapping: defaultValues(trackPageView.fields),
      type: 'automatic'
    },
    {
      partnerAction: 'aliasUser',
      name: 'Alias User',
      subscribe: 'type = "alias"',
      mapping: defaultValues(aliasUser.fields),
      type: 'automatic'
    },
    {
      partnerAction: 'createUpdateObject',
      name: 'Create or Update Object',
      subscribe: 'type = "group"',
      mapping: defaultValues(createUpdateObject.fields),
      type: 'automatic'
    }
  ],

  actions: {
    trackEvent,
    identifyUser,
    trackPageView,
    aliasUser,
    createUpdateObject,
    addTag,
    removeTag
  }
}

export default destination
