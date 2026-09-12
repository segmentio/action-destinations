export const API_VERSION = 'v1'
export const MAX_BATCH_SIZE = 1000

export const INTEGRATION_HEADER = 'X-Vault-Api-Integration'
export const INTEGRATION_NAME = 'segment'
export const INTEGRATION_VERSION = '0.1.0'
export const INTEGRATION_HEADER_VALUE = `${INTEGRATION_NAME}/v${INTEGRATION_VERSION}`

export const ENVIRONMENTS = {
  production: 'https://api.vaultdcr.com',
  staging: 'https://api.staging.vaultdcr.com'
} as const

export type Environment = keyof typeof ENVIRONMENTS

export const DEFAULT_ENVIRONMENT: Environment = 'production'

export function baseUrl(environment?: string): string {
  const env = (environment ?? DEFAULT_ENVIRONMENT) as Environment
  return ENVIRONMENTS[env] ?? ENVIRONMENTS[DEFAULT_ENVIRONMENT]
}

export const trackUrl = (environment?: string) => `${baseUrl(environment)}/webevents/${API_VERSION}/track`
export const batchUrl = (environment?: string) => `${baseUrl(environment)}/webevents/${API_VERSION}/batch`
