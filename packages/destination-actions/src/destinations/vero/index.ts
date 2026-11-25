import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { API_URL } from './constants'
import { requireId } from './functions'
import type { DeleteUserJSON } from './types'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'
import manageSubscriptions from './manageSubscriptions'
import manageTags from './manageTags'
import aliasUser from './aliasUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Vero (Actions)',
  slug: 'actions-vero',
  mode: 'cloud',
  description: 'Send Segment events, user profiles, subscriptions, tags and audiences to Vero.',
  authentication: {
    scheme: 'custom',
    fields: {
      authToken: {
        label: 'Auth Token',
        description: 'Your Vero auth token. Find it in Vero under Settings > Project settings > API keys.',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      searchParams: { auth_token: settings.authToken }
    }
  },
  onDelete: async (request, { payload }) => {
    const json: DeleteUserJSON = { id: requireId(payload.userId) }
    return request(`${API_URL}/users/delete`, {
      method: 'post',
      json
    })
  },
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Alias User',
      subscribe: 'type = "alias"',
      partnerAction: 'aliasUser',
      mapping: defaultValues(aliasUser.fields),
      type: 'automatic'
    }
  ],
  actions: {
    trackEvent,
    identifyUser,
    manageSubscriptions,
    manageTags,
    aliasUser
  }
}

export default destination
