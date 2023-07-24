import { IntegrationError } from '@segment/actions-core'
import { apiLookupLiquidKey } from '../previewApiLookup'
import { Profile } from '../Profile'
import { Liquid as LiquidJs } from 'liquidjs'
import { SendEmailPerformer } from './SendEmailPerformer'
export const Liquid = new LiquidJs()

export async function parseTemplating(
  this: SendEmailPerformer,
  content: string,
  liquidData: {
    profile: Profile
    [apiLookupLiquidKey]?: Record<string, unknown>
  },
  contentType: string
) {
  try {
    const parsedContent = await Liquid.parseAndRender(content, liquidData)
    return parsedContent
  } catch (error) {
    this.logger?.error(`templating parse failure - ${this.settings.spaceId} - [${error}]`)
    this.tags.push('reason:parse_templating')
    this.statsClient?.incr('actions-personas-messaging-sendgrid.error', 1)
    throw new IntegrationError(
      `Unable to parse templating in email ${contentType}`,
      `${contentType} templating parse failure`,
      400
    )
  }
}
