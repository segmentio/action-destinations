import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AllFields } from '../fields'
import type { FBClient, FBStandardEventType } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Send Event',
  description: 'Send a Standard or Custom Event to Facebook Conversions API.',
  platform: 'web',
  fields: AllFields,
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_event_name, event_config, eventID, eventSourceUrl, actionSource, userData, ...rest} = payload
    const options = buildOptions(payload)
    const isCustom = event_config.event_name === 'CustomEvent' ? true : false

    if(isCustom){
      client(
        'trackSingleCustom', 
        pixelId,
        custom_event_name as string,
        { ...rest },
        options
      )
    } else {
      client(
        'trackSingle', 
        pixelId,
        event_config.event_name as FBStandardEventType,
        { ...rest },
        options
      )
    }
  }
}

export default action