import type { ActionDefinition, RequestOptions, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

const BASE_API_URL = 'https://api.criteo.com/2022-01'

const getAdvertiserAudiences = async (
  request: RequestFn,
  settings: Settings
): Promise<Record<string, any>> => {
  if (isNaN(+settings.advertiser_id))
    throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

  const endpoint = `${BASE_API_URL}/audiences?advertiser-id=${settings.advertiser_id}`
  // TODO Authentication
  const headers = {
    authorization: `Bearer `,
  }

  const response = await request(
    endpoint, { method: 'GET', headers: headers }
  )
  const body = await response.json()

  if (response.status !== 200)
    throw new IntegrationError(
      "Error while fetching the Advertiser's audiences", body.errors[0].title, response.status
    )

  return body.data
}

const getAudienceId = async (
  request: RequestFn,
  settings: Settings,
  audience_key: string
): Promise<Number> => {
  if (!audience_key)
    throw new IntegrationError('Invalid Audience Key', 'Invalid input', 400)

  const advertiser_audiences = await getAdvertiserAudiences(request, settings)

  advertiser_audiences.array.forEach(audience => {
    if (audience.attributes.name === audience_key)
      return Number(audience.id)
  });

  const audience_id = createAudience(request, settings, audience_key)
  return audience_id
}

const createAudience = async (
  request: RequestFn,
  settings: Settings,
  audience_key: string
): Promise<Number> => {
  const endpoint = `${BASE_API_URL}/audiences`
  // TODO Authentication
  const headers = {
    authorization: `Bearer `,
  }

  const payload = {
    "data": {
      "attributes": {
        "advertiserId": settings.advertiser_id,
        "name": audience_key,
        "description": audience_key
      },
      "type": "Audience"
    }
  }

  const response = await request(
    endpoint, { method: 'POST', headers: headers, json: payload }
  )
  const body = await response.json()

  if (response.status !== 200)
    throw new IntegrationError(
      "Error while fetching the Advertiser's audiences", body.errors[0].title, response.status
    )

  return Number(body.data.id)
}

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
    let audience_key = ''
    //iterate over the array of track events
    for (const event_object of payload) {
      const event_type = event_object["type"];
      const user_email = event_object["context"]["traits"]["email"];
      audience_key = event_object["properties"]["audience_key"];
      //add user to the array
      if (user_email) {
        addUsers.push(user_email);
      }
    }

    //This will be payload for the Criteo API PATCH request
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

    //get Criteo Audience id

    const criteo_audience_id = getAudienceId(request, settings, audience_key)

    //this will later be modified with appropriate async function call for Criteo API requests
    return request('https://api.criteo.com', {
      method: 'post',
      json: criteo_payload
    })
  }
}

export default action
