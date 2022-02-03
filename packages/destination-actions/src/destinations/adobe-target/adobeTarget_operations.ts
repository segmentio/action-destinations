import { RequestClient, IntegrationError } from '@segment/actions-core'
import { flatten } from 'flatten-anything'

const objectToQueryString = (object: { [x: string]: any }) =>
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
      const traits = flatten(this.traits)
      const requestUrl = `https://${this.clientCode}.tt.omtrdc.net/m2/${
        this.clientCode
      }/profile/update?mbox3rdPartyId=${this.userId}&${objectToQueryString(traits)}`

      return this.request(requestUrl, {
        method: 'POST'
      })
    }
  }

  private lookupProfile = async (userId: string, clientCode: string): Promise<IntegrationError | undefined> => {
    try {
      await this.request(
        `http://segmentexchangepartn.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${userId}?client=${clientCode}`,
        { method: 'get' }
      )
    } catch (error) {
      return new IntegrationError('There is no profile found with this id', 'Profile not found', 404)
    }

    return undefined
  }
}
