import btoa from 'btoa-lite'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import upsertCustomAudiences from './upsertCustomAudiences'
import { CONSTANTS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Rokt Audiences (Actions)',
  slug: 'actions-rokt-audiences',
  mode: 'cloud',
  description: `
  This destination allows user to engage audiences using Rokt's Public APIs.
  User can connect Rokt Audiences (Actions) as a destination to their Engage Audience in Segment,
  which will create/update custom audiences in the Rokt data platform. Audiences can be defined with either
  email values or hashed (sha256) email values.
  `,
  authentication: {
    scheme: 'custom',
    fields: {
      rpub: {
        label: 'Rokt public key',
        description: 'Rokt public key, starts with `rpub-`',
        type: 'string',
        required: true
      },
      rsec: {
        label: 'Rokt secret key',
        description: 'Rokt secret key, starts with `rsec-`',
        type: 'password',
        required: true
      },
      accountid: {
        label: 'Rokt Account ID',
        description: 'Rokt ID assigned to your particular account.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request(CONSTANTS.ROKT_API_BASE_URL + CONSTANTS.ROKT_API_AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(settings.rpub + ':' + settings.rsec)}`
        },
        json: {
          accountId: settings.accountid
        }
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: { Authorization: `Basic ${btoa(settings.rpub + ':' + settings.rsec)}` }
    }
  },
  actions: {
    upsertCustomAudiences
  },
  presets: [
    {
      name: 'Sync Engage Audience to Rokt',
      subscribe: 'type = "track" or type = "identify"',
      partnerAction: 'upsertCustomAudiences',
      mapping: defaultValues(upsertCustomAudiences.fields),
      type: 'automatic'
    }
  ]
}

export default destination
