import type { ActionDefinition } from '@segment/actions-core'
import { RequestClient, RetryableError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { YahooTaxonomy } from '../api'
import { TaxonomyObject } from '../types'
/* Generates a Segment in Yahoo + a node for a customer if it doesn't exist */

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Yahoo Segment',
  description: 'Use this action to generate Yahoo Segment. Please refer to the docs for more detail',
  fields: {
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Provide audience name as it should be displayed in Yahoo platform',
      type: 'string',
      required: true
    },
    segment_audience_id: {
      label: 'Audience Id',
      description: 'Provide audience Id (aud_...) from audience URL in Segment Engage',
      type: 'string',
      required: true
    }
  },
  perform: async (request, { settings, payload }) => {
    return create_yahoo_segment(request, settings, payload)
  }
}

// Oauth1 authentication (only server part: provide key + token, exchange for access token)
async function create_yahoo_segment(request: RequestClient, settings: Settings, payload: Payload) {
  const yahooTaxonomyApiClient: YahooTaxonomy = new YahooTaxonomy(request)
  const taxonomy_req = await yahooTaxonomyApiClient.get_taxonomy()
  const taxonomy_arr: Array<TaxonomyObject> = await taxonomy_req.json()

  // If taxonomy is empty - create customer forder and audience subfolder
  if (taxonomy_arr.length == 0) {
    await create_customer_taxonomy(yahooTaxonomyApiClient, settings, payload)
    await create_segment_taxonomy(yahooTaxonomyApiClient, settings, payload)
  }

  // If taxonomy doesn't include customer folder - create customer forder and audience subfolder
  // Locate customer folder
  const customer_folder_index: number = taxonomy_arr.findIndex((customer_obj) => customer_obj.id == settings.mdm_id)

  if (customer_folder_index < 0) {
    const customer_taxonomy = await create_customer_taxonomy(yahooTaxonomyApiClient, settings, payload)
    if (customer_taxonomy?.status !== 200) {
      throw new RetryableError(`Retrying the attempt to create customer taxonomy`)
    }
    const segment_taxonomy = await create_segment_taxonomy(yahooTaxonomyApiClient, settings, payload)
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
      const segment_taxonomy = await create_segment_taxonomy(yahooTaxonomyApiClient, settings, payload)
      if (segment_taxonomy?.status !== 200) {
        throw new RetryableError(`Retrying the attempt to create segment taxonomy`)
      }
      return segment_taxonomy
    }
  }
}

async function create_customer_taxonomy(yahooTaxonomyApiClient: YahooTaxonomy, settings: Settings, payload: Payload) {
  const taxonomy_req = await yahooTaxonomyApiClient.get_taxonomy()
  const taxonomy_arr = await taxonomy_req.json()

  if (taxonomy_arr.length == 0) {
    return yahooTaxonomyApiClient.add_customer_taxonomy_node(settings, '', payload)
  }
}

async function create_segment_taxonomy(yahooTaxonomyApiClient: YahooTaxonomy, settings: Settings, payload: Payload) {
  const taxonomy_req = await yahooTaxonomyApiClient.get_taxonomy()
  const taxonomy_arr = await taxonomy_req.json()

  if (taxonomy_arr.length == 0) {
    return yahooTaxonomyApiClient.add_segment_subtaxonomy_node(settings.mdm_id, payload)
  }
}

export default action
