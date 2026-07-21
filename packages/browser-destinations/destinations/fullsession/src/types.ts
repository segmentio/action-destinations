import { fullSessionTracker } from 'fullsession'

type CustomEventData = {
  [key: string]: string | number
  [stringKey: `${string}_str`]: string
  [numberKey: `${string}_real`]: number
}

type UserCustomAttributes = {
  [attribute: string]: string
}

export type FUS = typeof fullSessionTracker
export { fullSessionTracker, CustomEventData, UserCustomAttributes }
