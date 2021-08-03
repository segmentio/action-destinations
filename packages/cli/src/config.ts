export const ASSET_PATH =
  process.env.NODE_ENV === 'production'
    ? 'https://cdn.segment.com/next-integrations/actions'
    : process.env.NODE_ENV === 'stage'
    ? 'https://cdn.segment.build/next-integrations/actions'
    : undefined
