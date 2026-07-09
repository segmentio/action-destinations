import type { E2EAudienceDestinationConfig, E2ETeardownAudienceContext } from '@segment/actions-core'
import { REGIONS, SEGMENT_ENDPOINT } from '../constants'

const audienceName = `e2e_test_audience_${Date.now()}`

function domainForRegion(regionName: unknown): string {
  const region = Object.values(REGIONS).find((r) => r.name === regionName)
  return region?.domain ?? REGIONS.DEFAULT.domain
}

export const config: E2EAudienceDestinationConfig = {
  settings: {
    integrationKey: { $env: 'E2E_PENDO_AUDIENCES_INTEGRATION_KEY' },
    // DEFAULT region (US) — REGIONS.DEFAULT.name resolves to https://app.pendo.io
    region: REGIONS.DEFAULT.name
  },
  audience: {
    audienceName,
    audienceSettings: {},
    createAudience: true,
    getAudience: true,
    teardown: async (context: E2ETeardownAudienceContext) => {
      const { settings, externalAudienceId } = context
      const integrationKey = settings.integrationKey as string
      const domain = domainForRegion(settings.region)

      const response = await fetch(`${domain}/${SEGMENT_ENDPOINT}/${externalAudienceId}`, {
        method: 'DELETE',
        headers: {
          'x-pendo-integration-key': integrationKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Failed to delete Pendo segment ${externalAudienceId}: ${response.status} ${body}`)
      }
    }
  }
}
