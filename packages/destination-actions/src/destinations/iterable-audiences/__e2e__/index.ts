import type { E2EAudienceDestinationConfig, E2ETeardownAudienceContext } from '@segment/actions-core'

const audienceName = `e2e_test_audience_${Date.now()}`

export const config: E2EAudienceDestinationConfig = {
  settings: {
    apiKey: { $env: 'E2E_ITERABLE_AUDIENCES_API_KEY' },
    iterableProjectType: 'hybrid'
  },
  audience: {
    audienceName,
    audienceSettings: {},
    createAudience: true,
    getAudience: false, // Iterable is only eventually consistent, so we can't reliably get the audience immediately after creating it
    teardown: async (context: E2ETeardownAudienceContext) => {
      const { settings, externalAudienceId } = context
      const apiKey = settings.apiKey as string

      const response = await fetch(`https://api.iterable.com/api/lists/${externalAudienceId}`, {
        method: 'DELETE',
        headers: { 'Api-Key': apiKey }
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Failed to delete list ${externalAudienceId}: ${response.status} ${body}`)
      }
    }
  }
}
