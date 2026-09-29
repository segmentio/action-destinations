import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError, ErrorCodes } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { adAccountId, audienceDescription, audienceLabel, existingAudienceId } from './fields'
import sync from './sync'
import { createAudience, getAudience } from './functions'
import { presets } from './presets'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',
  description: 'The Facebook Custom Audiences destination.',
  authentication: {
    scheme: 'oauth2',
    fields: {
      retlAdAccountId: {
        ...adAccountId,
        description:
          'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762). This is required to set up the connection, but can be overriden using the Engage Audience setting named "Advertiser Account ID".'
      }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  audienceFields: {
    engageAdAccountId: {
      ...adAccountId,
      description:
        'Your advertiser account id. Read [more](https://www.facebook.com/business/help/1492627900875762). This overrides the main Destination settings named "Advertiser Account ID".',
      required: false
    },
    existingAudienceId,
    audienceDescription,
    audienceLabel
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const {
        audienceName,
        audienceSettings: { engageAdAccountId, audienceDescription, audienceLabel, existingAudienceId } = {},
        settings: { retlAdAccountId } = {},
        features,
        statsContext
      } = createAudienceInput

      const trim = (value?: string) => (typeof value === 'string' ? value.trim() : undefined)

      const addAccountId = trim((engageAdAccountId ?? retlAdAccountId) as string) as string
      const trimmedAudienceDescription = trim(audienceDescription)
      const trimmedExistingAudienceId = trim(existingAudienceId)

      if (trimmedExistingAudienceId) {
        const { data: { externalId: id } = {}, error } = await getAudience(
          request,
          trimmedExistingAudienceId,
          features,
          statsContext
        )
        if (error) {
          throw new IntegrationError(
            `Could not connect to the existing Facebook Custom Audience with ID "${trimmedExistingAudienceId}". Check that the "Existing Audience ID" audience setting holds a valid Facebook Custom Audience ID and that the connected Facebook user has access to it. Leave that setting blank if you want Segment to create a new audience instead. ${error.message}`,
            ErrorCodes.GET_AUDIENCE_FAILED,
            400
          )
        }
        return { externalId: id as string }
      }

      const missingCreateFields = [
        ...(audienceName ? [] : ['"Audience Name"']),
        ...(addAccountId
          ? []
          : ['"Advertiser Account ID" (set it in the Audience settings, or in the Destination settings)']),
        ...(trimmedAudienceDescription ? [] : ['"Description"'])
      ]

      if (missingCreateFields.length) {
        throw new IntegrationError(
          `Could not create a new Facebook Custom Audience because required value(s) were not provided: ${missingCreateFields.join(
            ', '
          )}. Alternatively, populate the "Existing Audience ID" audience setting to connect to an audience which already exists in Facebook instead of creating one.`,
          ErrorCodes.CREATE_AUDIENCE_FAILED,
          400
        )
      }

      const { data: { externalId: id } = {}, error } = await createAudience(
        request,
        audienceName,
        addAccountId,
        trimmedAudienceDescription,
        features,
        statsContext,
        audienceLabel
      )
      if (error) {
        throw new IntegrationError(
          `Could not create a new Facebook Custom Audience named "${audienceName}" in ad account ${addAccountId}. ${error.message}`,
          ErrorCodes.CREATE_AUDIENCE_FAILED,
          400
        )
      }
      return { externalId: id as string }
    },
    async getAudience(request, getAudienceInput) {
      const { externalId, features, statsContext } = getAudienceInput
      const { data: { externalId: id } = {}, error } = await getAudience(request, externalId, features, statsContext)
      if (error) {
        throw new IntegrationError(error.message, ErrorCodes.GET_AUDIENCE_FAILED, 400)
      }
      return { externalId: id as string }
    }
  },
  actions: {
    sync
  },
  presets
}

export default destination
