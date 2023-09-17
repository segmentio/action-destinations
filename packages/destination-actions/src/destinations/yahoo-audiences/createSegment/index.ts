import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { gen_customer_taxonomy_payload, gen_oauth1_signature, gen_segment_subtaxonomy_payload } from '../utils-tax'
import { TAXONOMY_BASE_URL } from '../constants'
/* Generates a Segment in Yahoo Taxonomy */

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Yahoo Segment',
  description: 'Use this action to generate Yahoo Segment. Please refer to the docs for more detail',
  defaultSubscription: 'event = "Audience Entered" and event = "Audience Exited"',

  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Provide audience key. Maps to Yahoo Taxonomy segment node name',
      type: 'string',
      required: true
    },
    segment_audience_id: {
      label: 'Audience Id',
      description:
        'Provide audience Id (aud_...) from audience URL in Segment Engage. Maps to Yahoo Taxonomy segment node Id',
      type: 'string',
      required: true
    },
    engage_space_id: {
      label: 'Engage Space Id',
      description:
        'Provide Engage Space Id found in Unify > Settings > API Access. Maps to Yahoo Taxonomy customer node Id and name',
      type: 'string',
      required: true
    },
    customer_desc: {
      label: 'Space Description',
      description: 'Provide the description for Yahoo Taxonomy customer node, less then 1000 characters',
      type: 'string',
      required: false
    }
  },
  perform: async (request, { settings, payload, auth }) => {
    if (auth?.accessToken) {
      const creds = Buffer.from(auth?.accessToken, 'base64').toString()
      const tx_creds = JSON.parse(creds['tx'])
      return update_taxonomy(tx_creds, request, settings, payload)
    }
  }
}

async function update_taxonomy(tx_creds, request: RequestClient, settings: Settings, payload: Payload) {
  const tx_client_key = tx_creds['tx_client_key']
  const tx_client_secret = tx_creds['tx_client_secret']

  const oauth1_auth_string = gen_oauth1_signature(tx_client_key, tx_client_secret)
  // PUT node endpoint always returns 202 ACCEPTED unless bad JSON is passed

  await request(`${TAXONOMY_BASE_URL}/taxonomy/append/`, {
    method: 'PUT',
    body: gen_customer_taxonomy_payload(settings, payload),
    headers: {
      Authorization: oauth1_auth_string
    }
  })
  await request(`${TAXONOMY_BASE_URL}/taxonomy/append/${payload.engage_space_id}`, {
    method: 'PUT',
    body: gen_segment_subtaxonomy_payload(payload),
    headers: {
      Authorization: oauth1_auth_string
    }
  })

  // 'GET taxonomy' endpoint should not be used, because it doesn't consistently return the complete taxonomy
  /*
  const taxonomy_req = await yahooTaxonomyApiClient.get_taxonomy(client_key, client_secret)
  const taxonomy_arr: Array<TaxonomyObject> = await taxonomy_req.json()

  // If taxonomy is empty - create customer forder and audience subfolder
  if (taxonomy_arr.length == 0) {
    await create_customer_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
  }

  // If taxonomy doesn't include customer folder - create customer forder and audience subfolder
  // Locate customer folder

  const customer_folder_index: number = taxonomy_arr.findIndex(
    (customer_obj) => customer_obj.id == payload.engage_space_id
  )

  if (customer_folder_index < 0) {
    const customer_taxonomy = await create_customer_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    if (customer_taxonomy?.status !== 200) {
      throw new RetryableError(`Retrying the attempt to create customer taxonomy`)
    }
    const segment_taxonomy = await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
    if (segment_taxonomy?.status !== 200) {
      throw new RetryableError(`Retrying the attempt to create segment taxonomy`)
    }
    return segment_taxonomy
  } else {
    // If customer folder exists - check if audience folder exists, if not - create it
    if (
      taxonomy_arr[customer_folder_index].subTaxonomy.findIndex(
        (segment_obj: { id: string }) => segment_obj.id == payload.segment_audience_id
      ) < 0
    ) {
      const segment_taxonomy = await create_segment_taxonomy(client_key, client_secret,yahooTaxonomyApiClient, settings, payload)
      if (segment_taxonomy?.status !== 200) {
        throw new RetryableError(`Retrying the attempt to create segment taxonomy`)
      }
      return segment_taxonomy
    }
  }
  */
}

export default action
