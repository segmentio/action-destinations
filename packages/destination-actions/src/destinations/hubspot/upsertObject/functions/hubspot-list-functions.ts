import { Client } from '../client'
import { CachableList, PayloadWithFromId, AddRemoveFromListReq } from '../types'
import { StatsContext, RetryableError, PayloadValidationError } from '@segment/actions-core'
import { SubscriptionMetadata } from '@segment/actions-core/destination-kit'
import { getListFromCache, saveListToCache } from '../functions/cache-functions'
import { HubSpotError } from '../../errors'

export async function ensureList(
  client: Client,
  objectType: string,
  name?: string,
  shouldCreateList?: boolean,
  subscriptionMetadata?: SubscriptionMetadata,
  statsContext?: StatsContext
): Promise<CachableList | undefined> {
  if (!name) {
    return undefined
  }

  if(typeof shouldCreateList !== 'boolean'){
    return undefined
  }

  let cacheableList = getListFromCache(name, objectType, subscriptionMetadata, statsContext)

  if (cacheableList) {
    return cacheableList
  } else {
    cacheableList = await getListFromHubspot(client, name, objectType)
    if (cacheableList) {
      await saveListToCache(cacheableList, subscriptionMetadata, statsContext)
      return cacheableList
    }
    else {
      if(shouldCreateList){
        cacheableList = await createListInHubspot(client, name, objectType)
        if(cacheableList) {
          await saveListToCache(cacheableList, subscriptionMetadata, statsContext)
          return cacheableList
        }
      } else {
        throw new PayloadValidationError(`List with name ${name} does not exist in HubSpot. To create the list, set the 'Create List' field to true.`)
      }
    }
  }
  throw new PayloadValidationError(`Failed to ensure list with name ${name} in HubSpot`)
}

async function getListFromHubspot(
  client: Client,
  listName: string,
  objectType: string
): Promise<CachableList | undefined> {

  try {
    const response = await client.readList(listName)
    const { listId, name, objectTypeId, processingType } = response?.data?.list

    if (processingType != 'MANUAL') {
      return undefined
    } else {
      return {
        listId,
        name,
        objectType,
        objectTypeId
      }
    }
  } catch (err) {
    return undefined
  }
}

async function createListInHubspot(
  client: Client,
  name: string,
  objectType: string
): Promise<CachableList | undefined> {
  try {
    const response = await client.createList({
      name,
      objectTypeId: objectType,
      processingType: 'MANUAL'
    })
    
    if (response?.data.list) {
      const { listId, name, objectTypeId } = response.data.list
      return {
        listId,
        name,
        objectType: objectType,
        objectTypeId
      }
    }
    return undefined
  } catch (err) {
    if ((err as HubSpotError)?.response?.data?.subCategory === 'ILS.DUPLICATE_LIST_NAMES') {
      throw new RetryableError('Failed to create list: a list with this name already exists.')
    }
    throw err
  }
}

export async function sendLists(client: Client, cachableList: CachableList, fromRecordPayloads: PayloadWithFromId[]) {
  const json: AddRemoveFromListReq = {
    recordIdsToAdd: fromRecordPayloads
      .filter((p) => p.list_details?.list_action == true)
      .map((p) => p.object_details.record_id),
    recordIdsToRemove: fromRecordPayloads
      .filter((p) => p.list_details?.list_action == false)
      .map((p) => p.object_details.record_id)
  }
  await client.addRemoveFromList(cachableList.listId, json)
}
