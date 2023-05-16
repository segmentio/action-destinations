import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues, IntegrationError } from '@segment/actions-core'

import type { Settings } from './generated-types'
import { API_URL } from './utils/constants'

import trackEvent from './trackEvent'

import identifyUser from './identifyUser'

import identifyGroup from './identifyGroup'

import alias from './alias'

const destination: DestinationDefinition<Settings> = {
  name: 'Calliper',
  slug: 'calliper',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      companyId: {
        label: 'Company id',
        description: 'Your company id in Calliper.',
        type: 'string',
        required: true
      },
      segmentKey: {
        label: 'Segment Key',
        description: 'Your Segment Key in Calliper.',
        type: 'string',
        required: true
      }
    },

    testAuthentication: (request, { settings }) => {
      return request(`${API_URL}/validate-credentials`, {
        method: 'post',
        json: {
          companyId: settings.companyId,
          key: settings.segmentKey
        }
      })
    }
  },

  onDelete: async (request, { settings, payload }) => {
    if (!payload.userId) throw new IntegrationError('User id is required for deletion', 'Missing required field', 400)
    return request(`${API_URL}/user/${payload.userId}`, {
      method: 'delete',
      json: {
        companyId: settings.companyId,
        key: settings.segmentKey
      }
    })
  },

  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields)
    },
    {
      name: 'Identify Group',
      subscribe: 'type = "group"',
      partnerAction: 'identifyGroup',
      mapping: defaultValues(identifyGroup.fields)
    }
  ],

  actions: {
    trackEvent,
    identifyUser,
    identifyGroup,
    alias
  }
}

export default destination
