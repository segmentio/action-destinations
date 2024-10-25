import type { Settings } from './generated-types'

export const baseUrl = 'https://api-staging.getdrip.com'

export const headers: ((settings: Settings) => any) = settings => {
  const encodedApiKey = Buffer.from(`${settings.apiKey}:`).toString('base64')

  return {
    Authorization: `Basic ${encodedApiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Segment'
  }
}
