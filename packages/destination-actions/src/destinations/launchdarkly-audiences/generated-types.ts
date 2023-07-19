// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * We recommend creating a dedicated [LaunchDarkly service token](https://docs.launchdarkly.com/home/account-security/api-access-tokens#service-tokens) for this destination. The service token will need to have the ability to perform the `createSegment` and `updateIncluded` [role actions](https://docs.launchdarkly.com/home/members/role-actions#segment-actions).
   */
  apiKey: string
  /**
   * Find and copy the [client-side ID](https://app.launchdarkly.com/settings/projects) of the environment for your segment in the LaunchDarkly account settings page.
   */
  clientId: string
}
