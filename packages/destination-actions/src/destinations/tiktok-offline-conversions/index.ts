import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import trackOfflineConversion from './trackOfflineConversion'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Offline Conversion',
    subscribe: 'type="page"',
    partnerAction: 'trackOfflineConversion',
    mapping: defaultValues(trackOfflineConversion.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Tiktok Offline Conversions',
  slug: 'actions-tiktok-offline-conversions',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (request, { settings }) => {
      return request('url_to_check_auth', {
        method: 'post',
        json: {
          settings: settings
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'Access-Token': settings }
    }
  },
  presets,
  actions: {
    trackOfflineConversion
  }
}

export default destination
