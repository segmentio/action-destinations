import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { Contact, ChannelIdentifier, Identifiers, ChannelProperties, UpsertContactJSON, DataFields } from '../types'

class DDContactApi extends DDApi {
  constructor(api_host: string, client: RequestClient) {
    super(api_host, client)
  }

  /**
   * Fetches a contact from Dotdigital API.
   *
   * @param idType - The type of identifier (e.g., email, mobile number).
   * @param idValue - The value of the identifier.
   *
   * @returns A promise that resolves to a ContactResponse.
   */
  async getContact(idType: string, idValue: string | undefined): Promise<Contact> {
    const response: ModifiedResponse<Contact> = await this.get<Contact>(`/contacts/v3/${idType}/${idValue}`)
    return response.data
  }

  /**
   * Fetches a contact from Dotdigital API via means of Patch.
   *
   * @param channelIdentifier - The identifier of the contact channel.
   * @param data - The data to be sent in the request body.
   *
   * @returns A promise that resolves to a ContactResponse.
   */
  async fetchOrCreateContact<T>(channelIdentifier: ChannelIdentifier, data: T): Promise<Contact> {
    const [[idType, idValue]] = Object.entries(channelIdentifier)
    const response: ModifiedResponse<Contact> = await this.patch<Contact, T>(`/contacts/v3/${idType}/${idValue}`, data)
    return response.data
  }

  /**
   * Creates or updates a contact .
   * @param {Payload} payload - The event payload.
   * @returns {Promise<Contact>} A promise resolving to the contact data.
   */
  public async upsertContact(payload: { 
    channelIdentifier: string, 
    emailIdentifier?: string, 
    mobileNumberIdentifier?: string, 
    listId: number, 
    dataFields?: {[k: string]: unknown} 
  }): Promise<Contact> {
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, listId, dataFields } = payload

    const idValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier

    const identifiers: Identifiers = {
      ...(emailIdentifier && { email: emailIdentifier }),
      ...(mobileNumberIdentifier && { mobileNumber: mobileNumberIdentifier })
    }

    const channelProperties: ChannelProperties = {
      ...(emailIdentifier && {
        email: {
          status: 'subscribed',
          emailType: 'html',
          optInType: 'single'
        }
      }),
      ...(mobileNumberIdentifier && {
        sms: { status: 'subscribed' }
      })
    }

    const data: UpsertContactJSON = {
      identifiers,
      channelProperties,
      lists: [listId],
      dataFields: dataFields as DataFields
    }

    const response: ModifiedResponse<Contact> = await this.patch<Contact, UpsertContactJSON>(
      `/contacts/v3/${channelIdentifier}/${idValue}?merge-option=overwrite`,
      data
    )

    return response.data
  }
}

export default DDContactApi
