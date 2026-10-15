export const PRODUCTION_URL = 'https://segment.webhook.inflection.io/'
export const TESTING_URL = 'https://segment-ingestion.inflectionapp.net/'

export const ENVIRONMENT = {
  PRODUCTION: 'production',
  TESTING: 'testing'
} as const

export const OBJECT_HANDLING = {
  STRINGIFY: 'stringify',
  FLATTEN: 'flatten'
} as const

export const ARRAY_HANDLING = {
  STRINGIFY: 'stringify',
  FLATTEN: 'flatten',
  JOIN: 'join'
} as const

export const KEY_SEPARATOR = '_'
export const ARRAY_JOIN_DELIMITER = ','
