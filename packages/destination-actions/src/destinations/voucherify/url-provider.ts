import type { Settings } from './generated-types'

export const getVoucherifyEndpointURL = (settings: Settings, eventType: string) => {
  if (!settings.customURL) {
    throw new Error('URL not provided.')
  }

  return `${settings.customURL}/segmentio/${eventType}-processing`
}
