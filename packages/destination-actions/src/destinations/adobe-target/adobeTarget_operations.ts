import { RequestClient, IntegrationError } from '@segment/actions-core'

const attributes: { [x: string]: string } = {}
function getnestedObjects(obj: { [x: string]: any }, objectPath = '') {
  if (obj.traits) {
    obj = obj.traits
  }
  Object.keys(obj).forEach((key) => {
    const currObjectPath = objectPath ? `${objectPath}.${key}` : key
    if (typeof obj[key] !== 'object' && obj[key]) {
      attributes[currObjectPath] = obj[key].toString()
    } else {
      getnestedObjects(obj[key], currObjectPath)
    }
  })
  return attributes
}
const objectToQueryString = (object: { [x: string]: { toString: () => string } }) =>
  Object.keys(object)
    .map((key) => `profile.${key}=${object[key].toString()}`)
    .join('&')

export default class adobeTarget {
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
    console.log(err)
    if (err) {
      throw err
    } else {
      const traits = getnestedObjects(this.traits)
      const requestUrl = `https://${this.clientCode}.tt.omtrdc.net/m2/${
        this.clientCode
      }/profile/update?mbox3rdPartyId=${this.userId}&${objectToQueryString(traits)}`

      return await this.request(requestUrl, {
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
