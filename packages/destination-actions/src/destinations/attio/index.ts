import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyUser from './identifyUser'
import groupWorkspace from './groupWorkspace'
import assertRecord from './assertRecord'

const destination: DestinationDefinition<Settings> = {
  name: 'Attio (Actions)',
  description: 'The Attio destination allows you to assert Records in your Attio workspace based on Segment events',
  slug: 'actions-attio',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {},
    testAuthentication: (request) => request('https://api.attio.com/v1/token')
  },

  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    identifyUser,
    groupWorkspace,
    assertRecord
  },

  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Group Workspace',
      subscribe: 'type = "group"',
      partnerAction: 'groupWorkspace',
      mapping: defaultValues(groupWorkspace.fields),
      type: 'automatic'
    }
  ]
}

export default destination
