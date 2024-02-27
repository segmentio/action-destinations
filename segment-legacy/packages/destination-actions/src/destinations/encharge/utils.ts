export const enchargeIngestAPIBase =
  process.env.NODE_ENV === 'development' ? 'https://localhost:3005' : 'https://ingest.encharge.io'

export const enchargeIngestAPIURL = `${enchargeIngestAPIBase}/v1`

export const enchargeRestAPIBase = 'https://api.encharge.io'
