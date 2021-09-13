// @ts-ignore it's ok if CPS isn't available
import type { Client } from '@segment/control-plane-service-client'
// @ts-ignore it's ok if CPS isn't available
export type * from '@segment/control-plane-service-client'

let client: Client

export default async function loadCPS(): Client {
  if (!client) {
    const module = await import('@segment/control-plane-service-client')
    const ControlPlaneService = module.default as Client
    client = new ControlPlaneService({
      name: 'control-plane-service',
      url: 'http://control-plane-service.segment.local',
      userAgent: 'Segment (actions cli)',
      timeout: 10000,
      headers: {
        // All calls from this script are system-to-system and shouldn't require authz checks
        // TODO remove this once we support auth tokens
        'skip-authz': '1'
      }
    })
  }

  return client
}
