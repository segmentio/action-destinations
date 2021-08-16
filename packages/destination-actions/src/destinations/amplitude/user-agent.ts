import UaParser from '@amplitude/ua-parser-js'
import { omit } from 'lodash'

interface Payload {
  userAgent?: string
}

interface ParsedUA {
  os_name?: string
  os_version?: string
  device_model?: string
}

export function parseUserAgent(payload: Payload & ParsedUA): ParsedUA {
  if (!payload?.userAgent) {
    return omit(payload, 'userAgent')
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const parser = new UaParser(payload?.userAgent)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const device = parser.getDevice()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const os = parser.getOS()

  return {
    os_name: payload.os_name ?? os.name,
    os_version: payload.os_version ?? os.version,
    device_model: payload.device_model ?? device.model
  }
}
