export const ASSET_PATH =
  process.env.NODE_ENV === 'production' || process.env.SERVER_ENVIRONMENT === 'production'
    ? 'https://cdn.segment.com/next-integrations/actions'
    : 'https://cdn.segment.build/next-integrations/actions'
