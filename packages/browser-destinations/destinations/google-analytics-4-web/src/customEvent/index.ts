import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { user_id, user_properties, params } from '../ga4-properties'
import { updateUser } from '../ga4-functions'

const normalizeEventName = (name: string, lowercase: boolean | undefined): string => {
  name = name.trim()
  name = name.replace(/\s/g, '_')

  if (lowercase) {
    name = name.toLowerCase()
  }
  return name
}

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Custom Event',
  description: 'Send any custom event',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    name: {
      label: 'Event Name',
      description:
        'The unique name of the custom event created in GA4. GA4 does not accept spaces in event names so Segment will replace any spaces with underscores. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    lowercase: {
      label: 'Lowercase Event Name',
      description:
        'If true, the event name will be converted to lowercase before sending to Google. Event names are case sensitive in GA4 so enable this setting to avoid distinct events for casing differences. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'boolean',
      default: false
    },
    user_id: { ...user_id },
    user_properties: user_properties,
    params: params
  },
  perform: (gtag, { payload }) => {
    updateUser(payload.user_id, payload.user_properties, gtag)
    const event_name = normalizeEventName(payload.name, payload.lowercase)

    gtag('event', event_name, payload.params)
  }
}

export default action
