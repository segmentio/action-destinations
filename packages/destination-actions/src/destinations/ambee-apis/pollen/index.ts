import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Ambee Pollen',
  description: 'Ambee Pollen API gives access to real-time pollen count - tree, grass and weed, by latitude and longitude.',
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
    speciesRisk:{
      label: 'Species Risk',
      required: false,
      description:`Possible values 'true' or 'false'. Defaults to 'false'. Returns sub species level risk evaluation for regions that currently support sub species data`,
      type: 'boolean'
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perform: (request, {payload}) => {
    const addParam = payload.speciesRisk ? true:false;
    // Make your partner api request here!
    return request(`https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${payload.lat}&lng=${payload.lng}&speciesRisk=${addParam} `, {
      method: 'GET',
      headers:{
        'x-api-key' : payload.apiKey
      }
    })
  }
}

export default action
