import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the Qualtrics e2e tests:
 *
 *   E2E_QUALTRICS_DATACENTER - Qualtrics datacenter ID, i.e. the subdomain in https://<datacenter>.qualtrics.com.
 *
 * The API token is a placeholder. The fixtures check how requests are routed and rejected, not
 * what Qualtrics does with a valid account, so no real Qualtrics credentials are needed.
 */
export const config: E2EDestinationConfig = {
  settings: {
    apiToken: 'e2e-placeholder-token',
    datacenter: { $env: 'E2E_QUALTRICS_DATACENTER' }
  }
}
