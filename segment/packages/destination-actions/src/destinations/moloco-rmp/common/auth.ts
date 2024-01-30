import { AuthenticationScheme }  from '@segment/actions-core'
import { Settings } from './settings'

const export authentication: AuthenticationScheme = {
    scheme: 'custom',
    fields: {
        platform: {
            label: 'Platform',
            description: 'Name of the platform',
            type: 'string',
            required: true
        },
        apiKey: {
            label: 'API Key',
            description: 'The API key for the platform',
            type: 'password',
            required: true
        }
    },
    testAuthentication: (request, { settings: Settings }) => {
        // TODO: Consider implementing this function
        // Currently, we don't have a way to validate the authentication fields safely
    }
}
