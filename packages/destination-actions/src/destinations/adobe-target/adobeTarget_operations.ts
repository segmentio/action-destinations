import { RequestClient, IntegrationError, APIError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'

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

  updateProfile = async (statsContext: StatsContext | undefined) => {
    const err = await this.lookupProfile(this.userId, this.clientCode, statsContext)
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

  private lookupProfile = async (
    userId: string,
    clientCode: string,
    statsContext: StatsContext | undefined
  ): Promise<IntegrationError | undefined> => {
    try {
      await this.request(
        `https://${clientCode}.tt.omtrdc.net/rest/v1/profiles/thirdPartyId/${userId}?client=${clientCode}`,
        { method: 'get' }
      )
    } catch (error) {
      if (error instanceof Error) {
        // We are changing the error code here because Adobe Target's platform takes up to an hour to create/update a profile.
        // If we throw a 404, Centrifuge will discard the job and it will never be retried. Thereforce, we are throwing a 500.
        // Unless the API is failing, errors from this endpoint will reference that the user profile does not exist.
        // The 500 error code also works in Centrifuge in the scenario where the API is down. Hence, its choice as a trigger for a retry.
        const errorCode = error.message == 'Forbidden' ? 403 : 500

        if (errorCode == 500) {
          // For now, we will keep track of the number of times we run this flow.
          statsContext?.statsClient.incr('actions-adobe-target.profile-not-found', 1, statsContext.tags)
        }

        throw new APIError(error.message, errorCode)
      }
    }

    return undefined
  }
}
