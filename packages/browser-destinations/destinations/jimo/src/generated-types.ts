// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Id of the Jimo project. You can find the Project Id here: https://i.usejimo.com/settings/install/portal
   */
  projectId: string
  /**
   * Enable this option if you'd like Jimo to refetch experiences supposed to be shown to the user after user traits get updated. This is useful when if you have experiences that use segment based on Segment traits.
   */
  refetchExperiencesOnTraitsUpdate?: boolean
  /**
   * If true, Jimo SDK will be initialized only after a Segment event containing a userID has been triggered. This prevents from having anonymous profile created in Jimo.
   */
  manualInit?: boolean
}
