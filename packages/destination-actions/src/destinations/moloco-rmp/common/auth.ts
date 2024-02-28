import { AuthenticationScheme }  from '@segment/actions-core'
// import type { Settings } from './settings'

export const authentication: AuthenticationScheme = {
    scheme: 'custom',
    fields: {
        platformId: {
            label: 'Platform ID',
            description: 'ID of the platform',
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
}
