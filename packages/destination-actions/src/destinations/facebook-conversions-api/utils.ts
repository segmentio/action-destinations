import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'
import { API_VERSION, CANARY_API_VERSION } from './constants'

const FLAGON_NAME = 'facebook-capi-actions-canary-version'

export const get_api_version = (features: Features | undefined, statsContext: StatsContext | undefined): string => {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  if (features && features[FLAGON_NAME]) {
    tags?.push(`version:${CANARY_API_VERSION}`)
    statsClient?.incr(`fb_api_version`, 1, tags)
    return CANARY_API_VERSION
  }

  tags?.push(`version:${API_VERSION}`)
  statsClient?.incr(`fb_api_version`, 1, tags)
  return API_VERSION
}
