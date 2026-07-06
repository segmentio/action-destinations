import type { E2EDestinationConfig } from '@segment/actions-core'

/*
 * Environment variables required to run the Iterable e2e tests:
 *
 *   E2E_ITERABLE_API_KEY            - Iterable API key for the e2e test project (destination auth).
 *
 * updateSubscriptions fixtures additionally require real resource IDs from that project:
 *
 *   E2E_ITERABLE_MESSAGE_CHANNEL_ID - ID of a Marketing message channel (subscription_group_type = 'messageChannel').
 *   E2E_ITERABLE_MESSAGE_TYPE_ID    - ID of a message type under that channel (subscription_group_type = 'messageType').
 *   E2E_ITERABLE_EMAIL_LIST_ID      - ID of a Static list (subscription_group_type = 'emailList').
 */
export const config: E2EDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_API_KEY' },
    dataCenterLocation: 'united_states'
  }
}
