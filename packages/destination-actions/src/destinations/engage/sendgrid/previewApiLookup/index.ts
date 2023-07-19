import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { apiLookupActionFields, performApiLookup } from './api-lookups'
import { Profile } from '../Profile'

export const actionDefinition: ActionDefinition<Settings, Payload> = {
  title: 'Perform a single API lookup',
  description: 'Perform a single API lookup and return the response',
  fields: {
    ...apiLookupActionFields,
    traits: {
      label: 'Traits',
      description: "A user profile's traits",
      type: 'object',
      required: false
    }
  },
  perform: async (request, { settings, payload, statsContext, logger }) => {
    const statsClient = statsContext?.statsClient
    const tags = statsContext?.tags ?? []
    const { traits = {}, ...apiLookupConfig } = payload
    const profile: Profile = { traits: traits as Record<string, string> }
    const data = await performApiLookup(request, apiLookupConfig, profile, statsClient, tags, settings, logger)
    return {
      data
    }
  }
}
