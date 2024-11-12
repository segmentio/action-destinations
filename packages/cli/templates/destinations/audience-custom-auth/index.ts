import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings> = {
  name: '{{name}}',
  slug: '{{slug}}',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (request) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    }
  },

  audienceFields: {},

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

    // Get/Create are optional and only needed if you need to create an audience before sending events/users.
    createAudience: async (request, createAudienceInput) => {
      // Create an audience through the destination's API
      // Segment will save this externalId for subsequent calls; the externalId is used to keep track of the audience in our database
      return {externalId: ''}
    },
    
    getAudience: async (request, getAudienceInput) => {
      // Right now, `getAudience` will mostly serve as a check to ensure the audience still exists in the destination
      return {externalId: ''} 
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {}
}

export default destination
