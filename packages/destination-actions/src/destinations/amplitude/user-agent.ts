/* eslint-disable @typescript-eslint/no-unsafe-call */
import UaParser from '@amplitude/ua-parser-js'
import '../../decs.d.ts'

interface Payload {
  context?: {
    userAgent?: string
  }
}

interface ParsedUA {
  os_name?: string
  device_manufacturer?: string
  device_model?: string
}

export function parseUserAgent(payload: Payload): ParsedUA {
  if (!payload?.context?.userAgent) {
    return {}
  }
  const parser = new UaParser(payload?.context?.userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()
  return {
    os_name: os.name,
    device_manufacturer: device.vendor,
    device_model: device.model
  }
}
