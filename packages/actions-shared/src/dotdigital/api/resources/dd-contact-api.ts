import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import DDApi from '../dd-api'
import { Contact, ChannelIdentifier, Identifiers, ResubscribeOptions, ChannelProperties, UpsertContactJSON, DataFields } from '../types'

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
    emailType?: string,
    optInType?: string,
    updateEmailSubscription: boolean,
    emailSubscriptionStatus?: string,
    emailResubscribe: boolean,
    resubscribeWithoutChallengeEmail: boolean,
    preferredLocale?: string,
    redirectUrlAfterChallenge?: string,
    updateSmsSubscription: boolean,
    smsSubscriptionStatus?: string,
    listId: number,
    dataFields?: {[k: string]: unknown}
  }): Promise<Contact> {
    const {
      channelIdentifier,
      emailIdentifier,
      mobileNumberIdentifier,
      emailType = 'html',
      optInType = 'single',
      updateEmailSubscription = true,
      emailSubscriptionStatus = 'subscribed',
      emailResubscribe = false,
      resubscribeWithoutChallengeEmail = false,
      preferredLocale,
      redirectUrlAfterChallenge,
      updateSmsSubscription = true,
      smsSubscriptionStatus = 'subscribed',
      listId,
      dataFields
    } = payload

    const idValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier

    const identifiers: Identifiers = {
      ...(emailIdentifier && { email: emailIdentifier }),
      ...(mobileNumberIdentifier && { mobileNumber: mobileNumberIdentifier })
    }

    const channelProperties: ChannelProperties = {}

    // Email channel properties
    if (emailIdentifier) {
      channelProperties.email = {
        emailType,
        optInType
      }

      if (updateEmailSubscription) {
        if (emailSubscriptionStatus === 'subscribed') {
          // Only send status if resubscribe is enabled
          if (emailResubscribe) {
            channelProperties.email.status = 'subscribed'

            const resubscribeOptions: ResubscribeOptions = {
              resubscribeWithNoChallenge: resubscribeWithoutChallengeEmail
            }

            if (!resubscribeWithoutChallengeEmail) {
              if (preferredLocale) resubscribeOptions.preferredLocale = preferredLocale
              if (redirectUrlAfterChallenge) resubscribeOptions.redirectUrlAfterChallenge = redirectUrlAfterChallenge
            }

            channelProperties.email.resubscribeOptions = resubscribeOptions
          }
        } else if (emailSubscriptionStatus) {
          // For unsubscribed/suppressed, always send the status
          channelProperties.email.status = emailSubscriptionStatus
        }
      }
    }

    // SMS channel properties
    if (mobileNumberIdentifier && updateSmsSubscription && smsSubscriptionStatus) {
      channelProperties.sms = {
        status: smsSubscriptionStatus
      }
    }

    const data: UpsertContactJSON = {
      identifiers,
      channelProperties,
      ...(listId && { lists: [listId] }),
      dataFields: dataFields as DataFields
    }

    const response: ModifiedResponse<Contact> = await this.patch<Contact, UpsertContactJSON>(
      `/contacts/v3/${channelIdentifier}/${idValue}?merge-option=overwrite`,
      data
    )

    return response.data
  }

  /**
   * Unsubscribes a contact .
   * @param {Payload} payload - The event payload.
   * @returns {Promise<Contact>} A promise resolving to the contact data.
   */
  public async unsubscribeContact(payload: {
    channelIdentifier: string,
    emailIdentifier?: string,
    mobileNumberIdentifier?: string
  }): Promise<Contact> {
    const {
      channelIdentifier,
      emailIdentifier,
      mobileNumberIdentifier
    } = payload

    const idValue = channelIdentifier === 'email' ? emailIdentifier : mobileNumberIdentifier

    const identifiers: Identifiers = {
      ...(emailIdentifier && { email: emailIdentifier }),
      ...(mobileNumberIdentifier && { mobileNumber: mobileNumberIdentifier })
    }

    const channelProperties: ChannelProperties = {
      ...(emailIdentifier && {
        email: { status: 'unsubscribed' }
      }),
      ...(mobileNumberIdentifier && {
        sms: { status: 'unsubscribed' }
      })
    }

    const data: UpsertContactJSON = {
      identifiers,
      channelProperties
    }

    const response: ModifiedResponse<Contact> = await this.patch<Contact, UpsertContactJSON>(
      `/contacts/v3/${channelIdentifier}/${idValue}?merge-option=overwrite`,
      data
    )

    return response.data
  }
}

export default DDContactApi
