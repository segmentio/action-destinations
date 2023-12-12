import UaParser from '@amplitude/ua-parser-js'

interface ParsedUA {
  os_name?: string
  os_version?: string
  device_model?: string
  device_type?: string
}

interface UserAgentData {
  model?: string
  platformVersion?: string
}

export function parseUserAgentProperties(userAgent?: string, userAgentData?: UserAgentData): ParsedUA {
  if (!userAgent) {
    return {}
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const parser = new UaParser(userAgent)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const device = parser.getDevice()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const os = parser.getOS()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const browser = parser.getBrowser()

  return {
    os_name: os.name ?? browser.name,
    os_version: userAgentData?.platformVersion ?? browser.major,
    device_model: userAgentData?.model ?? os.name,
    device_type: device.type
  }
}
