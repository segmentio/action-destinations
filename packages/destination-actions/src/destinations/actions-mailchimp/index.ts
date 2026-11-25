import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { getBaseUrl, resolveDataCenter, PING_PATH } from './constants'

import addOrUpdateMember from './addOrUpdateMember'
import addOrRemoveTags from './addOrRemoveTags'

const destination: DestinationDefinition<Settings> = {
  name: 'Mailchimp (Actions)',
  slug: 'actions-mailchimp',
  mode: 'cloud',
  description: 'Sync Segment audience members and behavioral tags to Mailchimp audiences (lists).',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Your Mailchimp Marketing API key. Used as the password for HTTP Basic Auth. Find it under Account > Extras > API keys.',
        type: 'password',
        required: true
      },
      dataCenter: {
        label: 'Datacenter Prefix',
        description:
          'The datacenter prefix for your Mailchimp account (e.g. us6). If left blank, it is resolved automatically from the suffix of your API key.',
        type: 'string',
        required: false
      },
      audienceId: {
        label: 'Audience ID',
        description:
          'The default Mailchimp Audience (List) ID to send events to. Find it under Audience > Settings > Audience name and defaults ("Audience ID").',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      const baseUrl = getBaseUrl(resolveDataCenter(settings.apiKey, settings.dataCenter))
      return request(`${baseUrl}${PING_PATH}`, {
        method: 'get'
      })
    }
  },

  extendRequest({ settings }) {
    // Mailchimp uses HTTP Basic Auth: any non-empty username + the API key as password.
    const token = Buffer.from(`anystring:${settings.apiKey}`).toString('base64')
    return {
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    }
  },

  presets: [
    {
      name: 'Add or Update Audience Member',
      subscribe: 'type = "identify"',
      partnerAction: 'addOrUpdateMember',
      mapping: defaultValues(addOrUpdateMember.fields),
      type: 'automatic'
    },
    {
      name: 'Add or Remove Member Tags',
      subscribe: 'type = "track"',
      partnerAction: 'addOrRemoveTags',
      mapping: defaultValues(addOrRemoveTags.fields),
      type: 'automatic'
    }
  ],

  actions: {
    addOrUpdateMember,
    addOrRemoveTags
  }
}

export default destination
