import {
  APIError,
  ModifiedResponse,
  RequestClient
} from '@segment/actions-core';
import type { Settings } from '../../generated-types';
import DotdigitalApi from '../dotdigital-api';
import { Contact, ChannelIdentifier, Identifiers, ChannelProperties } from '../types'
import type { Payload } from '../../addContactToList/generated-types'

class DotdigitalContactApi extends DotdigitalApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client);
  }

  /**
   * Fetches a contact from Dotdigital API.
   *
   * @param contactIdentifier - The type of identifier (e.g., email, mobile number).
   * @param identifierValue - The value of the identifier.
   *
   * @returns A promise that resolves to a ContactResponse.
   */
  async getContact(
    contactIdentifier: string,
    identifierValue: string | undefined
  ): Promise<Contact> {
    try {
      const response: ModifiedResponse = await this.get(`/contacts/v3/${contactIdentifier}/${identifierValue}`);
      return JSON.parse(response.content) as Contact;
    } catch (error) {
      throw error as APIError ?? 'Failed to fetch contact';
    }
  }

  /**
   * Fetches a contact from Dotdigital API via means of Patch.
   *
   * @param channelIdentifier - The identifier of the contact channel.
   * @param _data - The data to be sent in the request body.
   *
   * @returns A promise that resolves to a ContactResponse.
   */
    async fetchOrCreateContact<T>(channelIdentifier: ChannelIdentifier, _data: T): Promise<Contact> {
      const [[contactIdentifier, identifierValue]] = Object.entries(channelIdentifier);
      try {
        const response: ModifiedResponse = await this.patch(`/contacts/v3/${contactIdentifier}/${identifierValue}`, _data);
        return JSON.parse(response.content) as Contact;
      } catch (error) {
        throw error as APIError ?? 'Failed to update contact';
      }
    }

  /**
   * Creates or updates a contact .
   * @param {Payload} payload - The event payload.
   * @returns {Promise<Contact>} A promise resolving to the contact data.
   */
  public async upsertContact(payload: Payload): Promise<Contact> {
    const { channelIdentifier, emailIdentifier, mobileNumberIdentifier, listId, dataFields } = payload
    const identifierValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier
    const identifiers:Identifiers = {}
    if (emailIdentifier) identifiers.email = emailIdentifier
    if (mobileNumberIdentifier) identifiers.mobileNumber = mobileNumberIdentifier

    const channelProperties:ChannelProperties = {}
    if (emailIdentifier) channelProperties.email = { status: 'subscribed', emailType: 'html', optInType: 'single' }
    if (mobileNumberIdentifier) channelProperties.sms = { status: 'subscribed' }

    const data = {
      identifiers,
      channelProperties,
      lists: [listId],
      dataFields: dataFields
    }

    const response: ModifiedResponse = await this.patch(
      `/contacts/v3/${channelIdentifier}/${identifierValue}?merge-option=overwrite`,
      data
    )
    return JSON.parse(response.content) as Contact
  }
}

export default DotdigitalContactApi
