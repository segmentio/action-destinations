import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError, PayloadValidationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

import addToAudience from './addToAudience'
import removeFromAudience from './removeFromAudience'
import { presets } from './presets'

const MNTN_API_BASE = 'https://integrations.ex.mountain.com'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'MNTN Audiences',
  slug: 'actions-mntn-audiences',
  mode: 'cloud',

  description:
    'Send Segment Engage audience membership data to MNTN. Syncs users into and out of MNTN audience segments using identity signals including email, phone, IP address, and Mobile Advertising ID (MAID).',

  authentication: {
    scheme: 'custom',
    fields: {
      advertiser_id: {
        label: 'Advertiser ID',
        description:
          'Your MNTN Advertiser ID, provided when you register as an MNTN advertiser. Contact your MNTN account manager if you need help locating this.',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description:
          'Your MNTN Audience API key, issued via the MNTN Integrations Marketplace. Treat this value as a secret — do not share it or commit it to source control.',
        type: 'password',
        required: true
      }
    },

    // Validates credentials by listing segments (read-only, no side effects).
    testAuthentication: (request) => {
      return request(`${MNTN_API_BASE}/v2026/audience/segments?limit=1`, {
        method: 'GET',
        throwHttpErrors: false
      }).then((response) => {
        if (response.status === 401) {
          throw new IntegrationError(
            'Authentication failed: the API Key provided is invalid or does not exist in MNTN. Please verify your credentials.',
            'INVALID_API_KEY',
            401
          )
        }
        if (!response.ok) {
          throw new IntegrationError(
            `Authentication check returned an unexpected response (HTTP ${response.status}). Please try again or contact MNTN support.`,
            'UNEXPECTED_ERROR',
            response.status
          )
        }
        return response
      })
    }
  },

  // Attach auth headers to every outbound request from this destination.
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    }
  },

  // Optional audience-level field: lets users point to a pre-existing MNTN segment.
  audienceFields: {
    segment_id: {
      label: 'MNTN Segment ID',
      description:
        'The ID of a pre-existing MNTN audience segment to sync to. If left blank, a new MNTN segment will be created automatically when this destination is enabled for an audience.',
      type: 'string'
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    /**
     * Called when a Segment Engage audience is first connected to this destination.
     * Creates a new MNTN audience segment (or reuses a pre-configured one) and
     * returns its ID as `externalId`, which Segment stores and passes back in
     * subsequent audience events at `context.personas.external_audience_id`.
     */
    async createAudience(request, createAudienceInput) {
      const { audienceName, settings, audienceSettings } = createAudienceInput

      // If the user already has an MNTN segment they want to target, use it directly.
      if (audienceSettings?.segment_id) {
        return { externalId: audienceSettings.segment_id }
      }

      if (!audienceName) {
        throw new PayloadValidationError(
          'Missing audience name. Provide an audience name or supply a pre-existing MNTN Segment ID in the audience settings.'
        )
      }

      const response = await request(`${MNTN_API_BASE}/v2026/audience/segments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${settings.api_key}` },
        json: {
          segment: {
            name: audienceName
            // Omitting `id` lets MNTN assign a unique ID automatically.
          }
        }
      })

      const body = (await response.json()) as { segment?: { id?: string } }

      if (!body?.segment?.id) {
        throw new IntegrationError(
          'MNTN returned an unexpected response when creating the audience segment. Please try again or contact MNTN support.',
          'INVALID_RESPONSE',
          500
        )
      }

      return { externalId: body.segment.id }
    },

    /**
     * Called by Segment to verify that a previously-created MNTN segment still exists.
     * Returns the segment's ID to confirm ownership.
     */
    async getAudience(request, getAudienceInput) {
      const { externalId, settings, audienceSettings } = getAudienceInput

      // Prefer the audience-level override; fall back to the stored externalId.
      const segmentId = audienceSettings?.segment_id || externalId

      if (!segmentId) {
        throw new IntegrationError(
          'No MNTN Segment ID found. Ensure the destination was properly initialized, or provide a Segment ID in the audience settings.',
          'MISSING_SEGMENT_ID',
          400
        )
      }

      const response = await request(
        `${MNTN_API_BASE}/v2026/audience/segments/${encodeURIComponent(segmentId)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${settings.api_key}` },
          throwHttpErrors: false
        }
      )

      if (response.status === 404) {
        throw new IntegrationError(
          `MNTN audience segment "${segmentId}" was not found. Verify the Segment ID in your audience settings.`,
          'SEGMENT_NOT_FOUND',
          404
        )
      }

      if (!response.ok) {
        throw new IntegrationError(
          `Unexpected error verifying MNTN segment (HTTP ${response.status}).`,
          'UNEXPECTED_ERROR',
          response.status
        )
      }

      const body = (await response.json()) as { segment?: { id?: string } }
      return { externalId: body.segment?.id ?? segmentId }
    }
  },

  actions: {
    addToAudience,
    removeFromAudience
  },

  presets
}

export default destination
