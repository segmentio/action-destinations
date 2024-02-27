import type { Settings } from './generated-types'

export function getHost(settings: Settings): string {
  let host = null
  switch (settings.region) {
    case 'EU': {
      host = 'https://function.eu1.ocp.optimizely.com/twilio_segment'
      break
    }
    case 'AU': {
      host = 'https://function.au1.ocp.optimizely.com/twilio_segment'
      break
    }
    default: {
      host = 'https://function.zaius.app/twilio_segment'
      break
    }
  }
  return host
}
