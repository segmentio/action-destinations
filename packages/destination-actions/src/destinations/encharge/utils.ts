import { ENCHARGE_INGEST_API_VERSION } from '../versioning-info'

export const enchargeIngestAPIBase =
  process.env.NODE_ENV === 'development' ? 'https://localhost:3005' : 'https://ingest.encharge.io'

export const enchargeIngestAPIURL = `${enchargeIngestAPIBase}/${ENCHARGE_INGEST_API_VERSION}`

export const enchargeRestAPIBase = 'https://api.encharge.io'
