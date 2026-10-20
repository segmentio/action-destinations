import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the Pipedrive e2e tests:
 *
 *   E2E_PIPEDRIVE_API_TOKEN - Pipedrive personal API token for the e2e test account (destination auth).
 *   E2E_PIPEDRIVE_DOMAIN    - Pipedrive company domain, i.e. the subdomain in https://<domain>.pipedrive.com.
 */
export const config: E2EDestinationConfig = {
  settings: {
    apiToken: { $env: 'E2E_PIPEDRIVE_API_TOKEN' },
    domain: { $env: 'E2E_PIPEDRIVE_DOMAIN' }
  }
}
