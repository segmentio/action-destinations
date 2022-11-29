import { RequestClient, IntegrationError } from '@segment/actions-core'

function getNestedObjects(obj: { [x: string]: any }, objectPath = '', attributes: { [x: string]: string } = {}) {
  // Do not run on null or undefined
  if (obj != null || obj != undefined) {
    Object.keys(obj).forEach((key) => {
      const currObjectPath = objectPath ? `${objectPath}.${key}` : key

      if (typeof obj[key] !== 'object') {
        attributes[currObjectPath] = obj[key].toString()
      } else {
        getNestedObjects(obj[key], currObjectPath, attributes)
      }
    })
    return attributes
  }
}
const objectToQueryString = (object: { [x: string]: { toString: () => string } }) =>
  Object.keys(object)
    .map((key) => `profile.${key}=${object[key].toString()}`)
    .join('&')

export default class AdobeTarget {
  userId: string
  clientCode: string
  traits: object
  request: RequestClient

  constructor(userId: string, clientCode: string, traits: object, request: RequestClient) {
    this.userId = userId
    this.clientCode = clientCode
    this.traits = traits
    this.request = request
  }

  updateProfile = async () => {
    const err = await this.lookupProfile(this.userId, this.clientCode)
    if (err) {
      throw err
    } else {
      const traits = getNestedObjects(this.traits)
      if (traits) {
        const requestUrl = `https://${this.clientCode}.tt.omtrdc.net/m2/${
          this.clientCode
        }/profile/update?mbox3rdPartyId=${this.userId}&${objectToQueryString(traits)}`

        return this.request(requestUrl, {
          method: 'POST'
        })
      }
    }
  }

  private lookupProfile = async (userId: string, clientCode: string): Promise<IntegrationError | undefined> => {
    try {
      await this.request(
        `https://${clientCode}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${userId}?client=${clientCode}`,
        { method: 'get' }
      )
    } catch (error) {
      if (error instanceof Error) {
        return new IntegrationError(error.message, error.message == 'Forbidden' ? '403' : '400')
      }
    }

    return undefined
  }
}
