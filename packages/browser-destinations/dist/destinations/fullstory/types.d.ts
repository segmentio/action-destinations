import * as FullStory from '@fullstory/browser'
export declare const FSPackage: typeof FullStory
export declare type FS = typeof FullStory & {
  setVars: (eventName: string, eventProperties: object, source: string) => {}
  setUserVars: (eventProperties: object, source: string) => void
  event: (
    eventName: string,
    eventProperties: {
      [key: string]: unknown
    },
    source: string
  ) => void
  identify: (uid: string, customVars: FullStory.UserVars, source: string) => void
}
