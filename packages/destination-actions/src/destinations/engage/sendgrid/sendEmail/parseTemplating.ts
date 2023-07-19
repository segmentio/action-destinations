import { IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'
import { apiLookupLiquidKey } from '../previewApiLookup/api-lookups'
import { Profile } from '../Profile'
import { Liquid as LiquidJs } from 'liquidjs'
export const Liquid = new LiquidJs()

export const parseTemplating = async (
  content: string,
  liquidData: {
    profile: Profile
    [apiLookupLiquidKey]?: Record<string, unknown>
  },
  contentType: string,
  statsClient: StatsClient | undefined,
  tags: string[],
  settings: Settings,
  logger?: Logger | undefined
) => {
  try {
    const parsedContent = await Liquid.parseAndRender(content, liquidData)
    return parsedContent
  } catch (error) {
    logger?.error(`TE Messaging: Email templating parse failure - ${settings.spaceId} - [${error}]`)
    tags.push('reason:parse_templating')
    statsClient?.incr('actions-personas-messaging-sendgrid.error', 1, tags)
    throw new IntegrationError(
      `Unable to parse templating in email ${contentType}`,
      `${contentType} templating parse failure`,
      400
    )
  }
}
