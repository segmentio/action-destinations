import UaParser from '@amplitude/ua-parser-js'

interface ParsedUA {
  os_name?: string
  os_version?: string
  device_model?: string
}

export function parseUserAgentProperties(userAgent?: string): ParsedUA {
  if (!userAgent) {
    return {}
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const parser = new UaParser(userAgent)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const device = parser.getDevice()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const os = parser.getOS()

  return {
    os_name: os.name,
    os_version: os.version,
    device_model: device.model
  }
}
