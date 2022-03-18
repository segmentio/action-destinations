interface ParsedUA {
  os_name?: string
  os_version?: string
  device_model?: string
  device_type?: string
}
export declare function parseUserAgentProperties(userAgent?: string): ParsedUA
export {}
