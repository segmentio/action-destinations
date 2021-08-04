import ControlPlaneService from '@segment/control-plane-service-client'
export * from '@segment/control-plane-service-client'

export const controlPlaneService = new ControlPlaneService({
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
