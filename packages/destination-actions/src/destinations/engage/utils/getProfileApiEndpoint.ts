// These profile calls will be removed when Profile sync can fetch external_id
export const getProfileApiEndpoint = (environment: string, region?: Region): string => {
  const domainName = region === 'eu-west-1' ? 'profiles.euw1.segment' : 'profiles.segment'
  const topLevelName = environment === 'production' ? 'com' : 'build'
  return `https://${domainName}.${topLevelName}`
}

export type Region = 'us-west-2' | 'eu-west-1'
