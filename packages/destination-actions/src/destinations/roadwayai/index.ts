import type { DestinationDefinition } from '@segment/actions-core'
import trackEvent from './trackEvent'

interface Settings {
  workspaceId: string
  apiKey: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Roadway AI',
  slug: 'roadwayai',
  mode: 'cloud',
  description: 'Send browser events (identify, group, track, etc.) to your RoadwayAI endpoint',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your RoadwayAI API key for authentication',
        type: 'string',
        required: true
      },
      workspaceId: {
        label: 'Workspace ID',
        description: 'Your RoadwayAI workspace ID where events should be sent',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) =>
      request(`http://localhost:8000/api/v1/segment/validate-credentials`, {
        method: 'POST',
        body: JSON.stringify({
          api_key: settings.apiKey,
          workspace_id: settings.workspaceId
        })
      })
  },

  actions: { trackEvent }
}

export default destination
