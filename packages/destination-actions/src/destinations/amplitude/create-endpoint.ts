export type EndpointOptions = {
  protocol?: string
  subdomains?: {
    europe?: string
    north_america?: string
  }
}

export type EndpointRegion = 'europe' | 'north_america'

const defaultOptions: EndpointOptions = {
  protocol: 'https',
  subdomains: {
    europe: 'api.eu',
    north_america: 'api'
  }
}

/**
 * Generates a region-specific Amplitude endpoint
 *
 * @param path path to api endpoint (e.g., '/usermap')
 * @param region specified region ('north_america' | 'europe')
 * @param options change protocol or subdomains of endpoint
 * @returns api endpoint string
 */
export default function createEndpoint(
  path: string,
  region: EndpointRegion = 'north_america',
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
    case 'north_america':
    default:
      region = 'north_america'
      break
  }

  const subdomain = subdomains[region] ?? ''
  path = path.replace(/^\/+/, '')
  return `${protocol}://${subdomain}${subdomain.length > 0 ? '.' : ''}amplitude.com/${path}`
}
