import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import event from './event'
import install from './install'

const destination: DestinationDefinition<Settings> = {
  name: 'Kochava (Actions)',
  slug: 'actions-kochava',
  mode: 'cloud',
  description: 'Send install and post-install event data to Kochava for mobile attribution and analytics.',
  authentication: {
    scheme: 'custom',
    fields: {
      kochava_app_id: {
        label: 'Kochava App ID',
        description:
          'The Kochava App GUID (unique application identifier) found in the Kochava dashboard. Sent with every request.',
        type: 'string',
        required: true
      }
    }
    // Kochava's Server-to-Server API exposes no auth-verification endpoint; the App GUID
    // is validated for presence via the required setting above, so there is no testAuthentication.
  },
  presets: [
    {
      name: 'Install Notification',
      partnerAction: 'install',
      subscribe: 'type = "track" and event = "Application Installed"',
      mapping: defaultValues(install.fields),
      type: 'automatic'
    },
    {
      name: 'Post-Install Event',
      partnerAction: 'event',
      subscribe: 'type = "track" and event != "Application Installed"',
      mapping: defaultValues(event.fields),
      type: 'automatic'
    }
  ],
  actions: {
    event,
    install
  }
}

export default destination
