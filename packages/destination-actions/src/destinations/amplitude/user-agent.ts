/* eslint-disable @typescript-eslint/no-unsafe-call */
import UaParser from '@amplitude/ua-parser-js'

interface Payload {
  userAgent?: string
}

interface ParsedUA {
  os_name?: string
  device_manufacturer?: string
  device_model?: string
}

export function parseUserAgent(payload: Payload): ParsedUA {
  if (!payload?.userAgent) {
    return {}
  }
  const parser = new UaParser(payload?.userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()
  return {
    os_name: os.name,
    device_manufacturer: device.vendor,
    device_model: device.model
  }
}
