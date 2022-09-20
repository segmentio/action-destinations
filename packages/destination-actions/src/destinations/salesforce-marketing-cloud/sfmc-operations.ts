import { RequestClient, IntegrationError } from '@segment/actions-core'
export default class SalesforceMarketingCloud {
  subdomain: string | undefined
  contactKey: string
  key?: string
  id?: string
  keys?: object
  values?: object
  request: RequestClient

  constructor(
    subdomain: string,
    contactKey: string,
    key: string,
    id: string,
    keys: object,
    values: object,
    request: RequestClient
  ) {
    this.subdomain = subdomain
    this.contactKey = contactKey
    this.key = key
    this.id = id
    this.keys = keys
    this.values = values
    this.request = request
  }

  upsertContact = async () => {
    const err = await this.createContact(this.contactKey, this.subdomain)
    if (err) {
      throw err
    } else {
      const keys = {
        contactKey: this.contactKey
      }
      console.log('keys:', keys)
      console.log('values', this.keys)
      return this.request(`https://${this.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
        method: 'post',
        json: [
          {
            keys: keys,
            values: this.keys
          }
        ]
      })
    }
  }

  private createContact = async (contactKey: String, subdomain: string): Promise<IntegrationError | undefined> => {
    const requestUrl = `https://${subdomain}.rest.marketingcloudapis.com/contacts/v1/contacts`
    console.log(requestUrl)
    try {
      await this.request(requestUrl, {
        method: 'POST',
        json: {
          contactKey: contactKey,
          attributeSets: []
        }
      })
    } catch (error) {
      return new IntegrationError('No profile found in Adobe Target with this mbox3rdPartyId', 'Profile not found', 404)
    }

    return undefined
  }

  private addtoDataExtension = async (
    subdomain: String,
    request: RequestClient,
    contactKey: String,
    key?: String,
    id?: string,
    values?: object,
    keys?: object
  ): Promise<IntegrationError | Response> => {
    if (!key && !id) {
      throw new IntegrationError(
        `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`,
        'Misconfigured required field',
        400
      )
    }
    if (key) {
      return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:${key}/rowset`, {
        method: 'post',
        json: [
          {
            keys: {
              contactKey: contactKey,
              ...keys
            },
            values: values
          }
        ]
      })
    } else {
      return request(`https://${subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/${id}/rowset`, {
        method: 'post',
        json: [
          {
            keys: {
              contactKey: contactKey,
              ...keys
            },
            values: values
          }
        ]
      })
    }
  }
}
