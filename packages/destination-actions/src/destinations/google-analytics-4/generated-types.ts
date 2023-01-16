// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * The Measurement ID associated with a stream. Found in the Google Analytics UI under: Admin > Data Streams > choose your stream > Measurement ID. **Required for web streams.**
   */
  measurementId?: string
  /**
   * The Firebase App ID associated with the Firebase app. Found in the Firebase console under: Project Settings > General > Your Apps > App ID. **Required for mobile app streams.**
   */
  firebaseAppId?: string
  /**
   * An API SECRET generated in the Google Analytics UI, navigate to: Admin > Data Streams > choose your stream > Measurement Protocol > Create
   */
  apiSecret: string
}
