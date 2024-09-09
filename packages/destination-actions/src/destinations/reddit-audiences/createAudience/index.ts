import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { createAudience } from '../functions'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Create Audience',
  description: 'Create a Custom Audience List to use within Reddit Ads Manager.',
  fields: {
    audience_name: {
      type: 'string',
      required: true,
      label: 'Audience Name',
      description:
        "The name you'd like to give to a new Reddit Audience that you're creating."
    },
    ad_account_id: {
      type: 'string',
      required: true,
      label: 'Ad Account ID',
      description:
        "The Reddit Ad Account ID that you are creating the audience under, including the t2_ or a2_ prefix (example: t2_abc123, a2_abc123). This can be found in the Reddit Ads Manager."
    }
  },

  perform: (request, { payload }) => {
    return createAudience(request, payload)
  }
}

export default action
