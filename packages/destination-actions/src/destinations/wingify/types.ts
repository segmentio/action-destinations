import { Payload as PagePayload } from './pageVisit/generated-types'
import { Payload as TrackPayload } from './trackEvent/generated-types'
import { Payload as IdentifyPayload } from './identifyUser/generated-types'

export type SegmentPayload = PagePayload | TrackPayload | IdentifyPayload

export type WingifyJSON = {
  d: {
    msgId: string
    visId: string
    event: {
      props: {
        wingify_og_event?: string
        url?: string
        $visitor?: {
          props: {
            wingify_fs_environment?: string
            [k: string]: unknown
          }
        }
        page: {
          [k: string]: unknown
        }
        [k: string]: unknown
        isCustomEvent?: boolean
        wingifyMeta: {
          source: string
          ogName?: string
          [k: string]: unknown
        }
      }
      name: string
      time: number
    }
    visitor?: {
      props: {
        wingify_fs_environment?: string
        [k: string]: unknown
      }
    }
    sessionId: number
  }
}