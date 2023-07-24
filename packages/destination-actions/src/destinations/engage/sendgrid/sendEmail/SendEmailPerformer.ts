import { IntegrationError } from '@segment/actions-core/errors'
import { ExtId, MessageSendPerformer } from '../../utils'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Profile } from '../Profile'
import { apiLookupLiquidKey } from '../previewApiLookup'
import { Liquid as LiquidJs } from 'liquidjs'
import { attemptEmailDelivery } from './attemptEmailDelivery'
export const Liquid = new LiquidJs()

export class SendEmailPerformer extends MessageSendPerformer<Settings, Payload> {
  getIntegrationStatsName(): string {
    return 'actions_personas_messaging_sendgrid'
  }

  getChannelType(): string {
    return 'email'
  }

  getDefaultSettingsRegion() {
    return 'us-west-2'
  }

  isSupportedExternalId(externalId: ExtId<Payload>): boolean {
    return externalId.type === 'email'
  }

  isExternalIdSubscribed(extId: ExtId<Payload>) {
    const bypass_subscription = this.payload.byPassSubscription !== undefined && this.payload.byPassSubscription
    if (bypass_subscription) {
      this.currentOperation?.logs.push('Bypassing subscription')
      return true
    }

    const isSubscribed = super.isExternalIdSubscribed(extId)
    if (!isSubscribed) return isSubscribed // may be undefined => as invalid

    if (!this.payload.groupId) return isSubscribed

    const recepientGroup = extId.groups?.find((g) => g.id === this.payload.groupId)
    if (!recepientGroup) {
      //statsClient?.incr('actions-personas-messaging-sendgrid.group_notfound', 1, tags)
      return false
    }
    if (!recepientGroup.isSubscribed) {
      //statsClient?.incr('actions-personas-messaging-sendgrid.group_notsubscribed', 1, tags)
      return false
    }

    return true
  }

  getRecepients(): ExtId<Payload>[] {
    //if toEmail specified => send test email requested
    if (this.payload.toEmail)
      return [
        {
          id: this.payload.toEmail,
          type: 'email',
          groups: [
            {
              id: this.payload.groupId
            }
          ]
        }
      ]
    // only email to the first found subscribed email id
    const res = super.getRecepients()
    if (res.length > 0) return [res[0]]
    return res
  }

  async parseTemplating(
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
      // this.tags.push('reason:parse_templating')
      // this.statsClient.incr('actions-personas-messaging-sendgrid.error', 1)
      throw new IntegrationError(
        `Unable to parse templating in email ${contentType}`,
        `${contentType} templating parse failure`,
        400
      )
    }
  }
  async sendToRecepient(emailProfile: ExtId<Payload>) {
    return attemptEmailDelivery.call(this, emailProfile)
  }
}

export type EmailProfile = ExtId<Payload>
