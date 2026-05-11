import { InvalidAuthenticationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Settings } from './generated-types'
import { createHmac } from 'crypto'

enum DatabaseRegion {
  EU_WEST = 'eu-west',
  CA_EAST = 'ca-east',
  AP_SE = 'ap-se',
  US_WEST = 'us-west',
  CUSTOM = 'custom'
}

type InternalAdditionalData = {
  internalAdditionalData?: Record<string, unknown>
}

type AddInteractionParams = {
  userId: string
  itemId: string
  timestamp?: string | number
  recommId?: string
  additionalData?: Record<string, unknown>
  cascadeCreate?: boolean
}

type AddBookmarkParams = AddInteractionParams

type AddCartAdditionParams = AddInteractionParams & {
  amount?: number
  price?: number
}

type AddDetailViewParams = AddInteractionParams & {
  duration?: number
}

type AddPurchaseParams = AddInteractionParams & {
  amount?: number
  price?: number
  profit?: number
}

type AddRatingParams = AddInteractionParams & {
  rating: number
}

type DeleteParams = {
  userId: string
  itemId: string
  timestamp?: string | number
}

type SetViewPortionParams = AddInteractionParams & {
  portion: number
  sessionId?: string
}

type BatchParams = {
  requests: Array<{
    method: HttpMethod
    path: string
    params:
      | AddBookmarkParams
      | AddCartAdditionParams
      | AddDetailViewParams
      | AddPurchaseParams
      | AddRatingParams
      | SetViewPortionParams
      | DeleteParams
      | {}
  }>
}

type HttpMethod = 'POST' | 'PUT' | 'DELETE'

function createAddInteractionData<T extends AddInteractionParams & InternalAdditionalData>(payload: T) {
  const { timestamp, additionalData, internalAdditionalData, ...rest } = payload
  return {
    timestamp: timestamp !== undefined ? datetimeToEpochSeconds(timestamp) : undefined,
    cascadeCreate: true,
    additionalData: {
      ...(additionalData || {}),
      ...(internalAdditionalData || {})
    },
    ...rest
  }
}

function datetimeToEpochSeconds(datetime: string | number): number {
  const numValue = Number(datetime)

  if (!isNaN(numValue) && String(datetime).trim() !== '') {
    if (numValue < 0) {
      throw new PayloadValidationError('Timestamp cannot be negative.')
    }

    // 10,000,000,000 is the year 2286 in seconds, anything larger is likely in milliseconds
    if (numValue >= 10000000000) {
      return numValue / 1000
    } else {
      return numValue
    }
  }

  const parsedDate = new Date(datetime)
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.getTime() / 1000
  }

  throw new PayloadValidationError(`Invalid timestamp provided: ${datetime}`)
}

abstract class Request<Params extends object> {
  constructor(public params: Params, public method: HttpMethod, public path: string) {}
}

export class Batch extends Request<BatchParams> {
  constructor(requests: BatchParams['requests']) {
    super({ requests }, 'POST', '/batch/')
  }
}

export class AddBookmark extends Request<AddBookmarkParams> {
  constructor(params: AddBookmarkParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/bookmarks/')
  }
}

export class AddCartAddition extends Request<AddCartAdditionParams> {
  constructor(params: AddCartAdditionParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/cartadditions/')
  }
}

export class AddDetailView extends Request<AddDetailViewParams> {
  constructor(params: AddDetailViewParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/detailviews/')
  }
}

export class AddPurchase extends Request<AddPurchaseParams> {
  constructor(params: AddPurchaseParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/purchases/')
  }
}

export class AddRating extends Request<AddRatingParams> {
  constructor(params: AddRatingParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/ratings/')
  }
}

export class SetViewPortion extends Request<SetViewPortionParams> {
  constructor(params: SetViewPortionParams & InternalAdditionalData) {
    super(createAddInteractionData(params), 'POST', '/viewportions/')
  }
}

function getDeleteUrl(interactionType: string, params: DeleteParams): string {
  const query = new URLSearchParams({
    userId: params.userId,
    itemId: params.itemId
  })

  if (params.timestamp !== undefined && params.timestamp !== null) {
    query.append('timestamp', String(datetimeToEpochSeconds(params.timestamp)))
  }

  return `/${interactionType}/?${query.toString()}`
}

export class DeleteBookmark extends Request<DeleteParams> {
  constructor(params: DeleteParams) {
    super(params, 'DELETE', getDeleteUrl('bookmarks', params))
  }
}

export class DeleteCartAddition extends Request<DeleteParams> {
  constructor(params: DeleteParams) {
    super(params, 'DELETE', getDeleteUrl('cartadditions', params))
  }
}

export class MergeUsers extends Request<{}> {
  constructor(targetUserId: string, sourceUserId: string) {
    super({}, 'PUT', `/users/${targetUserId}/merge/${sourceUserId}?cascadeCreate=true`)
  }
}

export class DeleteUser extends Request<{}> {
  constructor(userId: string) {
    super({}, 'DELETE', `/users/${userId}/`)
  }
}

export class RecombeeApiClient {
  constructor(private settings: Settings, private request: RequestClient) {}

  async send<Params extends object, T extends Request<Params>>(request: T) {
    const url = 'https://' + this.getBaseUri() + this.signUrl(request.path)
    const response = await this.request(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.params)
    })
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json()
    } else {
      return await response.text()
    }
  }

  private getBaseUri() {
    if (this.settings.databaseRegion === DatabaseRegion.CUSTOM) {
      if (!this.settings.apiUri) {
        throw new InvalidAuthenticationError('RAPI URI is required when using custom database region')
      }
      return this.settings.apiUri
    }

    const region = this.settings.databaseRegion || DatabaseRegion.EU_WEST
    return `rapi-${region}.recombee.com`
  }

  private signUrl(path: string) {
    const hash = 'sha1'

    let url = '/' + this.settings.databaseId + path
    url += (path.indexOf('?') == -1 ? '?' : '&') + 'hmac_timestamp=' + Math.floor(new Date().getTime() / 1000)

    const hmac = createHmac(hash, this.settings.privateToken).update(Buffer.from(url)).digest('hex')
    url += '&hmac_sign=' + hmac
    return url
  }
}
