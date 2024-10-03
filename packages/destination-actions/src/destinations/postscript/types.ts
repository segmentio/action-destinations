import { AUDIENCE_PROPERTY } from './const'

export type SubscriberResp = {
  subscribers: Array<Subscriber>
}

export type Subscriber = {
  properties?: {
    [AUDIENCE_PROPERTY]: string[]
  }
  id: string
}
