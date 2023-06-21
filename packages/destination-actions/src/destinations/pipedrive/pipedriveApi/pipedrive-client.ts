import { Settings } from '../generated-types'
import type { ExecuteInput, ModifiedResponse, RequestClient } from '@segment/actions-core'
import get from 'lodash/get'
import { ActivityTypes, PipedriveFields } from './domain'
import { DynamicFieldResponse } from '@segment/actions-core'

interface SearchFieldTypes {
  deal: 'dealField'
  person: 'personField'
  organization: 'organizationField'
  product: 'productField'
}

type ItemType = keyof SearchFieldTypes

const searchFieldMap: SearchFieldTypes = {
  deal: 'dealField',
  person: 'personField',
  product: 'productField',
  organization: 'organizationField'
}

const searchFieldMapForDynamicFields = {
  deal: 'dealFields',
  person: 'personFields',
  product: 'productFields',
  organization: 'organizationFields'
}

interface PipedriveFieldTypes extends SearchFieldTypes {
  activity: 'activityFields'
  note: 'noteFields'
}

const pipedriveFieldMap = {
  ...searchFieldMapForDynamicFields,
  activity: 'activityFields',
  note: 'noteFields'
}

interface SearchRequest<T extends ItemType> {
  term: string
  field_type: SearchFieldTypes[T]
  exact_match: boolean
  field_key: string
}

const cache = {}

class PipedriveClient {
  private settings: Settings
  private _request: RequestClient

  constructor(settings: Settings, request: RequestClient) {
    this.settings = settings
    this._request = request
  }

  async getId(item: ItemType, fieldName: string, term?: string): Promise<number | null> {
    if (!term) {
      return null
    }
    const searchParams: SearchRequest<typeof item> = {
      term,
      field_key: fieldName,
      exact_match: true,
      field_type: searchFieldMap[item]
    }

    let result = null
    try {
      const search = await this._request(`https://${this.settings.domain}.pipedrive.com/api/v1/itemSearch/field`, {
        searchParams: {
          ...searchParams,
          exact_match: true,
          return_item_ids: true
        }
      })
      result = get(search, 'data.data[0].id', null)
    } catch (e) {
      return result
    }

    return result
  }

  async getFields(item: keyof PipedriveFieldTypes): Promise<DynamicFieldResponse> {
    const cachedFields = get(cache, item, [])
    if (cachedFields.length > 0) {
      return cachedFields
    }
    const response = await this._request<PipedriveFields>(
      `https://${this.settings.domain}.pipedrive.com/api/v1/${pipedriveFieldMap[item]}`
    )
    const body = response.data
    const fields = body.data.map((f) => ({
      label: f.name,
      value: f.key
    }))
    const record = {
      choices: fields,
      pagination: {}
    }
    cachedFields[item] = record
    return record
  }

  async getActivityTypes(): Promise<DynamicFieldResponse> {
    const response = await this._request<ActivityTypes>(
      `https://${this.settings.domain}.pipedrive.com/api/v1/activityTypes`
    )
    const activityTypes = response.data
    const fields = activityTypes.data.map((f) => ({
      label: f.name,
      value: f.key_string
    }))
    const record = {
      choices: fields,
      pagination: {}
    }
    return record
  }

  async createUpdate(itemPath: string, item: Record<string, unknown>): Promise<ModifiedResponse> {
    if (item.id) {
      const id = item.id
      delete item['id']
      if (itemPath == 'leads') return this.patch(`${itemPath}/${id}`, item)
      else return this.put(`${itemPath}/${id}`, item)
    }
    return this.post(itemPath, item)
  }

  async post(path: string, payload: Record<string, unknown>): Promise<ModifiedResponse> {
    return this.reqWithPayload(path, payload, 'post')
  }

  async put(path: string, payload: Record<string, unknown>): Promise<ModifiedResponse> {
    return this.reqWithPayload(path, payload, 'put')
  }

  async patch(path: string, payload: Record<string, unknown>): Promise<ModifiedResponse> {
    return this.reqWithPayload(path, payload, 'patch')
  }

  async reqWithPayload(path: string, payload: Record<string, unknown>, method: 'post' | 'put' | 'patch') {
    PipedriveClient.filterPayload(payload)
    const urlBase = `https://${this.settings.domain}.pipedrive.com/api/v1`
    return this._request(`${urlBase}/${path}`, {
      method: method,
      json: payload
    })
  }

  static filterPayload(payload: Record<string, unknown>) {
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])
  }

  static fieldHandler(fieldType: keyof PipedriveFieldTypes) {
    return async (request: RequestClient, { settings }: ExecuteInput<Settings, unknown>) => {
      const client = new PipedriveClient(settings, request)
      return client.getFields(fieldType)
    }
  }
}

export default PipedriveClient
