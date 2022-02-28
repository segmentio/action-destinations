import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add users to Audience',
  description: 'Add users from Criteo audience by connecting to Criteo API',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    //These fields (for the action only) are able to accept input from the Segment event.
    audience_key: {
      label: 'Audience key',
      description: "Unique name for personas audience",
      type: 'string',
      allowNull: true,
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    event: {
      label: 'Event name',
      description: "Event for audience entering or exiting",
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      default: {
        '@path': '$.traits.email'
      }
    },
  },
  //perform method seems to be mandatory to implement
  //Although, we would use performBatch to parse the batch events
  perform: () => {
    return
  },
  //the performBatch function will have code to handle 
  //the personas event batch and send request to Criteo API


  performBatch: (request, { settings, payload }) => {
    let addUsers = []; //array of all user identifiers in the batch

    //iterate over the array of track events
    for (const event_object of payload) {
      const event_type = event_object["type"];
      const user_email = event_object["context"]["traits"]["email"];
      const audience_key = event_object["properties"]["audience_key"];
      //add user to the array
      if (user_email) {
        addUsers.push(user_email);
      }
    }
    const criteo_payload = {
      "data": {
        "type": "ContactlistAmendment",
        "attributes": {
          "operation": "add",
          "identifierType": "email",
          "identifiers": addUsers
        }
      }
    }

    //this will later be modified with appropriate async function call for Criteo API requests
    return request('https://api.criteo.com', {
      method: 'post',
      json: criteo_payload
    })
  }
}

export default action
