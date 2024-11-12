import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import insiderAudiences from './insiderAudiences'

const destination: DestinationDefinition<Settings> = {
  name: 'Insider Audiences',
  slug: 'actions-insider-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      account_name: {
        label: 'Account Name',
        description:
          'You can get your Account Name via Insider Inone Panel > Settings > Inone Settings > Account Preferences.',
        type: 'string',
        required: true
      },
      ucd_key: {
        label: 'API Key',
        description: 'You can get your API Key via Insider Inone Panel > Settings > Preferences > Integration Settings',
        type: 'password',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { 'X-PARTNER-NAME': settings.account_name, 'X-REQUEST-TOKEN': settings.ucd_key }
    }
  },

  actions: {
    insiderAudiences
  },
  presets: [
    {
      name: 'Sync Engage Audience to Insider',
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'insiderAudiences',
      mapping: defaultValues(insiderAudiences.fields),
      type: 'automatic'
    }
  ]
}

export default destination
