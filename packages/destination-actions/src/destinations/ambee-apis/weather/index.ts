import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ambee Weather',
  description: 'Ambee Weather API gives access to real-time local weather updates for temperature, pressure, humidity, wind, cloud coverage, visibility, and dew point of any location in the world by latitude and longitude.',
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
    return request(`https://api.ambeedata.com/weather/latest/by-lat-lng?lat=${payload.lat}&lng=${payload.lng}`, {
      method: 'GET',
      headers:{
        'x-api-key' : payload.apiKey
      }
    })
  }
}

export default action
