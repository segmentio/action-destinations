import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { AllFields } from './fields'
import type { FBClient, FBStandardEventType, FBNonStandardEventType } from '../types'
import { buildOptions } from './utils'
import { getNotVisibleForEvent } from './depends-on'
import { validate } from './validate'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Send Event',
  description: 'Send a Standard or Custom Event to Facebook Conversions API.',
  platform: 'web',
  fields: AllFields,
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { 
        event_config: { custom_event_name, show_fields, event_name } = {},
        eventID,
        eventSourceUrl,
        actionSource,
        userData,
        ...rest
    } = payload

    const isCustom = event_name === 'CustomEvent' ? true : false

    if(isCustom){
        validate(payload)
    }

    if(show_fields === false){
        // If show_fields is false we delete values for fields which are hidden in the UI. 
        const fieldsToDelete = getNotVisibleForEvent(event_name as FBStandardEventType | FBNonStandardEventType)
        fieldsToDelete.forEach(field => {
            if (field in rest) {
                delete rest[field as keyof typeof rest]
            }
        })
    }

    const options = buildOptions(payload)
  
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
        event_name as FBStandardEventType,
        { ...rest },
        options
      )
    }
  }
}

export default action