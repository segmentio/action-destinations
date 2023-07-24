import cheerio from 'cheerio'
import { EmailProfile, SendEmailPerformer } from './SendEmailPerformer'

export function insertUnsubscribeLinks(this: SendEmailPerformer, html: string, emailProfile: EmailProfile): string {
  const spaceId = this.settings.spaceId
  const groupId = this.payload.groupId
  const globalUnsubscribeLink = emailProfile?.unsubscribeLink
  const preferencesLink = emailProfile?.preferencesLink
  const unsubscribeLinkRef = 'a[href*="[upa_unsubscribe_link]"]'
  const preferencesLinkRef = 'a[href*="[upa_preferences_link]"]'
  const sendgridUnsubscribeLinkTag = '[unsubscribe]'
  const $ = cheerio.load(html)
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const _this = this
  if (groupId) {
    const group = emailProfile.groups?.find((grp) => grp.id === groupId)
    const groupUnsubscribeLink = group?.groupUnsubscribeLink
    $(unsubscribeLinkRef).each(function () {
      if (!groupUnsubscribeLink) {
        _this.logger.info(`Group Unsubscribe link missing  - ${spaceId}`)
        _this.statsClient.incr('actions-personas-messaging-sendgrid.group_unsubscribe_link_missing', 1)
        $(this).attr('href', sendgridUnsubscribeLinkTag)
      } else {
        $(this).attr('href', groupUnsubscribeLink)
        _this.logger?.info(`Group Unsubscribe link replaced  - ${spaceId}`)
        _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_group_unsubscribe_link', 1)
      }
    })
  } else {
    $(unsubscribeLinkRef).each(function () {
      if (!globalUnsubscribeLink) {
        _this.logger?.info(`Global Unsubscribe link missing  - ${spaceId}`)
        _this.statsClient?.incr('actions-personas-messaging-sendgrid.global_unsubscribe_link_missing', 1)
        $(this).attr('href', sendgridUnsubscribeLinkTag)
      } else {
        $(this).attr('href', globalUnsubscribeLink)
        _this.logger?.info(`Global Unsubscribe link replaced  - ${spaceId}`)
        _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_global_unsubscribe_link', 1)
      }
    })
  }
  $(preferencesLinkRef).each(function () {
    if (!preferencesLink) {
      // Remove the Manage Preferences link placeholder and the pipe (' | ') symbol
      $(this.parent?.children).each(function () {
        if ($(this).text() == ' | ') {
          $(this).remove()
        }
      })
      $(this).remove()
      _this.logger?.info(`Preferences link removed from the html body  - ${spaceId}`)
      _this.statsClient?.incr('actions-personas-messaging-sendgrid.removed_preferences_link', 1)
    } else {
      $(this).attr('href', preferencesLink)
      _this.logger?.info(`Preferences link replaced  - ${spaceId}`)
      _this.statsClient?.incr('actions-personas-messaging-sendgrid.replaced_preferences_link', 1)
    }
  })

  return $.html()
}
