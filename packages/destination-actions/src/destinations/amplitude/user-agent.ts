import UaParser from '@amplitude/ua-parser-js'
import { removeUndefined } from '@segment/actions-core'
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
  const parser = new UaParser(payload?.userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()
  return removeUndefined({
    os_name: payload.os_name ?? os.name,
    os_version: payload.os_version ?? os.version,
    device_model: payload.device_model ?? device.model
  })
}
