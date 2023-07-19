import cheerio from 'cheerio'
import { Logger, StatsClient } from '@segment/actions-core/destination-kit'

export const insertUnsubscribeLinks = (
  html: string,
  emailProfile: any,
  spaceId: string,
  statsClient: StatsClient | undefined,
  tags: string[],
  groupId?: string,
  logger?: Logger | undefined
): string => {
  const globalUnsubscribeLink = emailProfile?.unsubscribeLink
  const preferencesLink = emailProfile?.preferencesLink
  const unsubscribeLinkRef = 'a[href*="[upa_unsubscribe_link]"]'
  const preferencesLinkRef = 'a[href*="[upa_preferences_link]"]'
  const sendgridUnsubscribeLinkTag = '[unsubscribe]'
  const $ = cheerio.load(html)
  if (groupId) {
    const group = emailProfile?.groups.find((group: { id: string }) => group?.id === groupId)
    const groupUnsubscribeLink = group?.groupUnsubscribeLink
    $(unsubscribeLinkRef).each(function () {
      if (!groupUnsubscribeLink) {
        logger?.info(`TE Messaging: Email Group Unsubscribe link missing  - ${spaceId}`)
        statsClient?.incr('actions-personas-messaging-sendgrid.group_unsubscribe_link_missing', 1, tags)
        $(this).attr('href', sendgridUnsubscribeLinkTag)
      } else {
        $(this).attr('href', groupUnsubscribeLink)
        logger?.info(`TE Messaging: Email Group Unsubscribe link replaced  - ${spaceId}`)
        statsClient?.incr('actions-personas-messaging-sendgrid.replaced_group_unsubscribe_link', 1, tags)
      }
    })
  } else {
    $(unsubscribeLinkRef).each(function () {
      if (!globalUnsubscribeLink) {
        logger?.info(`TE Messaging: Email Global Unsubscribe link missing  - ${spaceId}`)
        statsClient?.incr('actions-personas-messaging-sendgrid.global_unsubscribe_link_missing', 1, tags)
        $(this).attr('href', sendgridUnsubscribeLinkTag)
      } else {
        $(this).attr('href', globalUnsubscribeLink)
        logger?.info(`TE Messaging: Email Global Unsubscribe link replaced  - ${spaceId}`)
        statsClient?.incr('actions-personas-messaging-sendgrid.replaced_global_unsubscribe_link', 1, tags)
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
      logger?.info(`TE Messaging: Email Preferences link removed from the html body  - ${spaceId}`)
      statsClient?.incr('actions-personas-messaging-sendgrid.removed_preferences_link', 1, tags)
    } else {
      $(this).attr('href', preferencesLink)
      logger?.info(`TE Messaging: Email Preferences link replaced  - ${spaceId}`)
      statsClient?.incr('actions-personas-messaging-sendgrid.replaced_preferences_link', 1, tags)
    }
  })

  return $.html()
}
