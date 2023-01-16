import type { Settings } from './generated-types'

export const getVoucherifyEndpointURL = (settings: Settings, eventType: string) => {
  let voucherifyRequestURL: string

  if (settings.customURL) {
    voucherifyRequestURL = `${settings.customURL}/segmentio/${eventType}-processing`
  } else {
    throw new Error('URL not provided.')
  }
  return voucherifyRequestURL
}
