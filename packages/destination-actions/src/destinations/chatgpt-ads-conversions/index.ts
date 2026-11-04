import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendConversion from './sendConversion'
import { presets } from './presets'

const destination: DestinationDefinition<Settings> = {
  name: 'ChatGPT Ads Conversions',
  slug: 'actions-chatgpt-ads-conversions',
  mode: 'cloud',
  description: 'Send conversion events to the ChatGPT Ads Conversions API.',

  authentication: {
    scheme: 'custom',
    fields: {
      pixel_id: {
        label: 'Pixel ID',
        description: 'The Pixel ID from the Conversions tab in ChatGPT Ads Manager.',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description: 'The Conversions API key from the Conversions tab in ChatGPT Ads Manager.',
        type: 'password',
        required: true
      },
      validate_only: {
        label: 'Validate Only',
        description:
          'When enabled, ChatGPT Ads validates events without saving them. Use this for test scenarios only.',
        type: 'boolean',
        default: false
      }
    }
  },

  presets,

  actions: {
    sendConversion
  }
}

export default destination
