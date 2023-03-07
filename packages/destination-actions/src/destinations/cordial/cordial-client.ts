import { Settings } from './generated-types'
import { RequestClient } from '@segment/actions-core'
import { Payload as AddContactToListPayload } from './addContactToList/generated-types'
import { Payload as CreateContactactivityPayload } from './createContactactivity/generated-types'
import { Payload as RemoveContactFromListPayload } from './removeContactFromList/generated-types'
import { Payload as UpsertContactPayload } from './upsertContact/generated-types'
import { Payload as AddProductToCartPayload } from './addProductToCart/generated-types'
import { Payload as RemoveProductFromCartPayload } from './removeProductFromCart/generated-types'
import { Payload as UpsertOrder } from './upsertOrder/generated-types'
import { Payload as MergeContacts } from './mergeContacts/generated-types'

export interface IdentifiableRequest {
  segmentId?: string | null,
  anonymousId?: string | null,
  userIdentities?: {
    [k: string]: unknown
  }
}

class CordialClient {
  private readonly apiUrl: string
  private readonly request: RequestClient
  private readonly identityKeys: object

  constructor(settings: Settings, request: RequestClient) {
    this.apiUrl = `${settings.endpoint}/api/segment`
    this.request = request
    this.identityKeys = {
      segmentIdKey: settings.segmentIdKey,
    }
  }

  extractIdentities(payload: IdentifiableRequest): IdentifiableRequest {
    return {
      segmentId: payload.segmentId,
      anonymousId: payload.anonymousId,
      userIdentities: payload.userIdentities,
    }
  }

  async addContactActivity(payload: CreateContactactivityPayload) {
    return this.request(`${this.apiUrl}/createContactactivity`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        action: payload.action,
        time: payload.time,
        properties: payload.properties,
        context: payload.context
      }
    })
  }

  async upsertContact(payload: UpsertContactPayload) {
    return this.request(`${this.apiUrl}/upsertContact`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        attributes: payload.attributes
      }
    })
  }

  async addContactToList(payload: AddContactToListPayload) {
    return this.request(`${this.apiUrl}/addContactToList`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        groupId: payload.groupId,
        listName: payload.listName
      }
    })
  }

  async removeContactFromList(payload: RemoveContactFromListPayload) {
    return this.request(`${this.apiUrl}/removeContactFromList`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        groupId: payload.groupId
      }
    })
  }

  async addProductToCart(payload: AddProductToCartPayload) {
    return this.request(`${this.apiUrl}/addProductToCart`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        productID: payload.productID,
        sku: payload.sku,
        qty: payload.qty,
        category: payload.category,
        name: payload.name,
        description: payload.description,
        itemPrice: payload.itemPrice,
        url: payload.url,
        imageUrl: payload.imageUrl,
        properties: payload.properties
      }
    })
  }

  async removeProductFromCart(payload: RemoveProductFromCartPayload) {
    return this.request(`${this.apiUrl}/removeProductFromCart`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        productID: payload.productID,
        qty: payload.qty
      }
    })
  }

  async upsertOrder(payload: UpsertOrder) {
    return this.request(`${this.apiUrl}/upsertOrder`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        ...this.extractIdentities(payload),
        orderID: payload.orderID,
        purchaseDate: payload.purchaseDate,
        status: payload.status,
        totalAmount: payload.totalAmount,
        properties: payload.properties,
        items: payload.items
      }
    })
  }

  mergeContacts(payload: MergeContacts) {
    return this.request(`${this.apiUrl}/mergeContacts`, {
      method: 'post',
      json: {
        ...this.identityKeys,
        anonymousId: payload.anonymousId,
        segmentId: payload.segmentId,
        previousId: payload.previousId
      }
    })
  }
}

export default CordialClient
