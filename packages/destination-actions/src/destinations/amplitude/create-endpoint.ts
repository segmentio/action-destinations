export type EndpointOptions = {
  protocol?: string
  subdomains?: {
    [key: string]: string
  }
}

export type EndpointRegion = 'northAmerica' | 'europe'

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
export default function createEndpoint(
  path: string,
  region: EndpointRegion = 'northAmerica',
  options: EndpointOptions = {}
): string {
  const protocol = options.protocol?.replace('://', '') ?? defaultOptions.protocol
  const subdomains = {
    ...defaultOptions.subdomains,
    ...options.subdomains
  }

  switch (region) {
    case 'europe':
      break
    case 'northAmerica':
    default:
      region = 'northAmerica'
      break
  }

  const subdomain = subdomains[region] ?? ''
  path = path.replace(/^\/+/, '')
  return `${protocol}://${subdomain}${subdomain.length > 0 ? '.' : ''}amplitude.com/${path}`
}
