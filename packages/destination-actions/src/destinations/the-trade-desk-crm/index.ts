import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'The Trade Desk Crm',
  slug: 'actions-the-trade-desk-crm',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      auth_token: {
        label: 'Authentication Token',
        description:
          'Your long-lived Trade Desk authentication token. Please see The Trade Desk’s [authentication documentation](https://api.thetradedesk.com/v3/portal/api/doc/Authentication) for information on how to generate a long-lived API Token via the Manage API Tokens in the developer Portal.',
        type: 'string',
        required: true
      },
      advertiser_id: {
        label: 'Advertiser ID',
        description:
          'The platform ID of the advertiser for which to retrieve the status of the specified CRM data segment.',
        type: 'string',
        required: true
      }
    }
  },
  actions: {
    syncAudience
  }
}

export default destination
