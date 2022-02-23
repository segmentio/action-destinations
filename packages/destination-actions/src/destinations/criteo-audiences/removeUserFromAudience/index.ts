import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Remove users from Audience',
  description: 'Remove users from Criteo audience by connecting to Criteo API',
  defaultSubscription: 'type = "track" and event = "Audience Exited"',
  fields: {
    //These fields (for the action only) are able to accept input from the Segment event.
    user_id: {
      label: 'User ID',
      description: 'User ID in Segment',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    //computation_id: {

    //},
    //event:{
    //Audience Exited or Audience entered
    //},
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      allowNull: true,
      default: {
        '@path': '$.traits.email'
      }
    },
  },
  //perform method seems to be mandatory to implement
  //Although, we would use performBatch to parse the batch events
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  },
  //the performBatch function will have code to handle 
  //the personas event batch and send request to Criteo API
  performBatch: (request, data) => {
    // write logic to iterate over the array of track events
    // send the resulting payload to criteo's endpoint

    //code to use computation key to get audience id from Criteo
    //OR create new audience if audience DOES NOT EXIST

    // batches contain up to 1000 track events each
    // audience of 150,000 = 150 batches of 1,000 events each

    return request('https://api.criteo.com', {
      method: 'post',
      json: data.payload
    })
  }
}


export default action
