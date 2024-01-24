export function assetPath(env: string): string {
  return env === 'production'
    ? 'https://cdn.segment.com/next-integrations/actions'
    : 'https://cdn.segment.build/next-integrations/actions'
}
