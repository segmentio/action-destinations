import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// TODO: reasonable default paths

const action: BrowserActionDefinition<Settings, Function, Payload> = {
  title: 'Counter Activity',
  description: 'Counter tags are used to count the number of conversions.',
  platform: 'web',
  fields: {
    activityGroupTagString: {
      label: 'Activity Group Tag String',
      description:
        'An identifier for the Floodlight activity group associated with this activity, which appears as a parameter in your tags. This value is case sensitive.',
      type: 'string',
      required: true
    },
    activityTagString: {
      label: 'Activity Tag String',
      description:
        'An identifier for your Floodlight activity, which appears as a parameter in your tags. This value is case sensitive.',
      type: 'string',
      required: true
    },
    enableDynamicTags: {
      label: 'Enable Dynamic Tags',
      type: 'boolean',
      description:
        'In Campaign Manager, go to Floodlight -> Configuration, under Tags, if **Dynamic** is selected, select **True**'
    },
    countingMethod: {
      label: 'Counting Method',
      type: 'string',
      description: 'Specifies how conversions will be counted for this Floodlight activity.',
      choices: ['standard', 'unique', 'per_session'],
      required: true
    },
    sessionId: {
      label: 'Session ID',
      description:
        'Use this field to insert a unique session ID if you’re using counter tags with a per session counting methodology. The session ID tells Campaign Manager 360 to count only one event per session on your site.',
      type: 'string'
    },
    uVariables: {
      label: 'U Variables',
      description:
        'Custom Floodlight variables enable you to capture information beyond the basics (visits and revenue) that you can collect with standard parameters in your tags.',
      type: 'object'
    },
    dcCustomParams: {
      label: 'Custom Parameters',
      description:
        'You can insert custom data into event snippets with the dc_custom_params field. This field accepts any values you want to pass to Google Marketing Platform.',
      type: 'object'
    }
  },
  perform: (gtag, { payload, settings }) => {
    gtag('event', 'conversion', {
      allow_custom_scripts: payload.enableDynamicTags,
      send_to: `${settings.advertiserId}/${payload.activityGroupTagString}/${payload.activityTagString}+${payload.countingMethod}`,
      ...(payload.sessionId !== undefined &&
        payload.countingMethod == 'per_session' && { session_id: payload.sessionId }),
      ...payload.uVariables,
      ...(payload.dcCustomParams !== undefined && { dc_custom_params: { ...payload.dcCustomParams } })
    })
  }
}

export default action
