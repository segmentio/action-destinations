import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'

interface Settings {
  apiKey: string
  workspaceId: string
}

interface Payload {
  type?: string
  [key: string]: any
}

const BROWSER_EVENTS = ['identify', 'group', 'track', 'page', 'screen', 'alias']

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send browser events to your endpoint',

  fields: {},

  perform: async (request, { settings, payload }) => {
    if (!payload) {
      throw new PayloadValidationError('No event payload')
    }

    if (payload.type && BROWSER_EVENTS.includes(payload.type)) {
      return request(`https://app.roadwayai.com/api/v1/segment/events`, {
        method: 'POST',
        headers: {
          'x-api-key': settings.apiKey,
          'x-workspace-id': settings.workspaceId
        },
        json: payload
      })
    }

    return { success: true, skipped: true }
  },

  performBatch: async (request, { settings, payload }) => {
    if (!payload || payload.length === 0) {
      throw new PayloadValidationError('No events in batch')
    }

    const browserEvents = payload.filter((event) => event && event.type && BROWSER_EVENTS.includes(event.type))

    if (browserEvents.length === 0) {
      return { success: true, skipped: true }
    }

    return request(`https://app.roadwayai.com/api/v1/segment/events`, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey,
        'x-workspace-id': settings.workspaceId
      },
      json: browserEvents
    })
  }
}

export default action
