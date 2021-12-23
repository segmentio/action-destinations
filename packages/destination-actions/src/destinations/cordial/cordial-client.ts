import { Settings } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import { Payload as ContactActivityPayload } from './createContactactivity/generated-types'

interface Attribute {
  name: string
  type: string
  key: string
}

interface ContactAttributes {
  [key: string]: string | number
}

interface List {
  id: number
  name: string
  segment_group_id: string
}

interface CreateListResponse {
  id: number
  success: boolean
}

class CordialClient {
  private readonly apiUrl: string
  private readonly request: RequestClient

  constructor(settings: Settings, request: RequestClient) {
    this.apiUrl = `${settings.endpoint}/v2`
    this.request = request
  }

  addContactActivity(payload: ContactActivityPayload) {
    return this.request(`${this.apiUrl}/contactactivities`, {
      method: 'post',
      json: {
        [payload.identifyByKey]: payload.identifyByValue,
        a: payload.action,
        time: payload.time,
        properties: payload.properties
      }
    })
  }

  async upsertContact(userIdentifier: object, attributes?: ContactAttributes) {
    return this.request(`${this.apiUrl}/contacts`, {
      method: 'post',
      json: {
        ...userIdentifier,
        ...attributes,
        request_source: 'integration-segment'
      }
    })
  }

  async getList(segmentGroupId: string, listName?: string): Promise<List | null> {
    let result = null
    try {
      const lists = await this.request<Array<List>>(`${this.apiUrl}/accountlists`, {
        method: 'get'
      })

      for (const list of lists.data) {
        if (list.segment_group_id == segmentGroupId) {
          result = list
          break
        }
      }

      if (!result && listName) {
        listName = this.prepareListName(listName)
        for (const list of lists.data) {
          if (list.name == listName) {
            result = list
            break
          }
        }
      }
    } catch (e) {
      return result
    }

    return result
  }

  async upsertList(segmentGroupId: string, listName?: string): Promise<List> {
    const list = await this.getList(segmentGroupId, listName)
    if (list) {
      return list
    }

    if (!listName) {
      listName = 'segment_' + segmentGroupId
    }

    listName = this.prepareListName(listName)

    const response = await this.request<CreateListResponse>(`${this.apiUrl}/accountlists`, {
      method: 'post',
      json: {
        name: listName,
        enhanced: true,
        segment_group_id: segmentGroupId
      }
    })

    return {
      id: response.data.id,
      name: listName,
      segment_group_id: segmentGroupId
    }
  }

  async addContactToList(userIdentifier: object, list: List) {
    return this.request(`${this.apiUrl}/contacts`, {
      method: 'post',
      json: {
        ...userIdentifier,
        [list.name]: true
      }
    })
  }

  async removeContactFromList(userIdentifier: object, list: List) {
    return this.request(`${this.apiUrl}/contacts`, {
      method: 'post',
      json: {
        ...userIdentifier,
        [list.name]: false
      }
    })
  }

  async transformAttributes(rawAttributes: { [key: string]: any }): Promise<ContactAttributes> {
    const attributes: ContactAttributes = {}
    const availableAttributes = await this.getAttributes()

    for (const key in availableAttributes) {
      if (key in rawAttributes) {
        const value = rawAttributes[key]
        if (typeof value !== 'object') {
          attributes[key] = value
        }
      }
    }

    return attributes
  }

  protected async getAttributes(): Promise<{ [key: string]: Attribute }> {
    const response = await this.request<{ [key: string]: Attribute }>(`${this.apiUrl}/accountcontactattributes`, {
      method: 'get'
    })

    return response.data
  }

  protected prepareListName(listName: string): string {
    return listName.replace(' ', '-')
  }
}

export default CordialClient
