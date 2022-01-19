import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Adobe Target Cloud',
  slug: 'actions-adobe-target-cloud',
  mode: 'cloud',
  description: 'The Adobe Target Cloud destination',

  authentication: {
    scheme: 'custom',
    fields: {
      jwt_token: {
        label: 'JWT Token',
        description:
          'To establish a secure service-to-service Adobe I/O API session, you must create a JSON Web Token (JWT) that encapsulates the identity of your integration, and then exchange it for an access token',
        type: 'password',
        required: true
      },
      client_id: {
        label: 'Client ID',
        description: 'Adobe.io Client ID',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'Client Secret',
        description: 'Adobe.io Client Secret',
        type: 'string',
        required: true
      },
      tenant_id: {
        label: 'Tenant ID',
        description:
          'The tenantId is your Adobe Experience Cloud tenant ID. It is present as a subdomain of your Experience Cloud URL. For example, if your Experience Cloud URL is piedpiper.experiencecloud.adobe.com or piedpiper.marketing.adobe.com, the tenant ID is piedpiper.',
        type: 'string',
        required: true
      },
      auth_token: {
        label: 'Auth Token -- TEMPORAL VALUE',
        description:
          'This value is the result of the JWT Auth Flow. The setting will be removed once the new flow is supported by the framework.',
        type: 'string',
        required: true
      }
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        authorization: `Bearer ${settings.auth_token}`,
        'x-api-key': settings.client_id
      }
    }
  },

  onDelete: async (request, { settings, payload }) => {
    console.log(request, settings, payload)
  },

  actions: {}
}

export default destination
