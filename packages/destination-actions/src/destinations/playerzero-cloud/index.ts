import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import forwardEvent from './forwardEvent'
import identifyUser from './identifyUser'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Forward Event',
    subscribe: 'type = "track" or type = "page" or type = "screen"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(forwardEvent.fields)
  },
  {
    name: 'Identify User',
    subscribe: 'type = "identify" or type = "group" or type = "alias"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'PlayerZero Cloud',
  slug: 'actions-playerzero-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      projectToken: {
        label: 'PlayerZero Project Token',
        description:
          'The Project Token for the PlayerZero project you want to send data to. You can find this Token on the [Segment (Cloud) Connector](https://go.playerzero.app/connector/segment-cloud) page.',
        type: 'string',
        required: true
      }
    }
  },

  presets,
  actions: {
    forwardEvent,
    identifyUser
  }
}

export default destination
