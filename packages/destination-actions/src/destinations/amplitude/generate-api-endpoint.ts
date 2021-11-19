export type EndpointOptions = {
  protocol?: string
  subdomains?: {
    europe?: string
    northAmerica?: string
  }
}

export type EndpointRegion = 'europe' | 'northAmerica'

const defaultOptions: EndpointOptions = {
  protocol: 'https',
  subdomains: {
    europe: 'api.eu',
    northAmerica: 'api'
  }
}

/**
 * Generates a region-specific Amplitude endpoint
 *
 * @param path path to api endpoint (e.g., 'usermap')
 * @param region specified region (e.g., 'europe')
 * @param options change protocol or subdomains of endpoint
 * @returns api endpoint string
 */
export default function generateApiEndpoint(
  path: string,
  region: EndpointRegion = 'northAmerica',
  options: EndpointOptions = {}
): string {
  options = {
    protocol: options.protocol?.replace('://', '') ?? defaultOptions.protocol,
    subdomains: {
      ...defaultOptions.subdomains,
      ...options.subdomains
    }
  }
  switch (region) {
    case 'europe':
      break
    case 'northAmerica':
    default:
      region = 'northAmerica'
      break
  }
  const subdomain = options.subdomains![region] ?? ''
  path = path.replace(/^\/+/, '')
  return `${options.protocol}://${subdomain}${subdomain.length > 0 ? '.' : ''}amplitude.com/${path}`
}
