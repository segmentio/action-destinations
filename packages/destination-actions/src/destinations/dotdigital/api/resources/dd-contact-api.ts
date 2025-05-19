import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { Contact, ChannelIdentifier, Identifiers, ChannelProperties } from '../types'
import type { Payload } from '../../addContactToList/generated-types'

class DDContactApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
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
    const response: ModifiedResponse = await this.get(`/contacts/v3/${idType}/${idValue}`)
    return JSON.parse(response.content)
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
    const response: ModifiedResponse = await this.patch(`/contacts/v3/${idType}/${idValue}`, data)
    return JSON.parse(response.content)
  }

  /**
   * Creates or updates a contact .
   * @param {Payload} payload - The event payload.
   * @returns {Promise<Contact>} A promise resolving to the contact data.
   */
  public async upsertContact(payload: Payload): Promise<Contact> {
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

    const data = {
      identifiers,
      channelProperties,
      lists: [listId],
      dataFields
    }

    const response: ModifiedResponse = await this.patch(
      `/contacts/v3/${channelIdentifier}/${idValue}?merge-option=overwrite`,
      data
    )

    return JSON.parse(response.content)
  }
}

export default DDContactApi
