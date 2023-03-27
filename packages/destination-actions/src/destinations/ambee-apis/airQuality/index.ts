import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ambee Air Quality',
  description: 'Ambee Air Quality API helps you to get real-time, hyper local air quality data for any location by passing the geographic coordinates.',
  fields: {
    apiKey: {
      label: 'API Key ',
      description: 'Unique key obtained after signup to API Dashboard link (https://api-dashboard.getambee.com)',
      type: 'string',
      required: true,
      format: 'text'
    },
    lat: {
      label: 'Latitude',
      required: true,
      description:"Latitude of the place to search",
      type: 'number'
    },
    lng: {
      label: 'Longitude',
      required: true,
      description:'Longitude of the place to search',
      type: 'number'
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perform: (request, {payload}) => {
    // Make your partner api request here!
    return request(`https://api.ambeedata.com/latest/by-lat-lng?lat=${payload.lat}&lng=${payload.lng}`, {
      method: 'GET',
      headers:{
        'x-api-key' : payload.apiKey
      }
    })
  }
}

export default action
