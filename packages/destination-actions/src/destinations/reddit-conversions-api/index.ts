import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import custom from './custom'

const destination: DestinationDefinition<Settings> = {
  name: 'Reddit Conversions Api',
  slug: 'actions-reddit-conversions-api',
  mode: 'cloud',
  description: 'Send Segment events to Reddit Conversions API.',
  authentication: {
    scheme: 'custom',
    fields: {
      conversion_token: {
        label: 'Conversion Token',
        description:
          'The conversion token for your Reddit account. This can be found by following the steps mentioned [here](https://business.reddithelp.com/helpcenter/s/article/conversion-access-token).',
        type: 'string',
        required: true
      },
      ad_account_id: {
        label: 'Ad Account ID',
        description:
          'Unique identifier of an ad account. This can be found in the Reddit UI.',
        type: 'string',
        required: true
      }
    }
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // }
  },
  presets: [
    {
      name: 'Page Visit',
      subscribe: 'type = "page"',
      partnerAction: 'custom',
      mapping: {
        ...defaultValues(pageVisit.fields),
        event_type: { tracking_type: 'PageVisit' }
      },
      type: 'automatic'
    },
    {
      name: 'View Content',
      subscribe: 'type = "track" AND event = "Product Viewed"',
      partnerAction: 'reportConversionEvent',
      mapping: {
        ...defaultValues(reportConversionEvent.fields),
        event_type: { tracking_type: 'ViewContent' }
      },
      type: 'automatic'
    }
  ],

  actions: {
    custom
  }
}

export default destination
