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
