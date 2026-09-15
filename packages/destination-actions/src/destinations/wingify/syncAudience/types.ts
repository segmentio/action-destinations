export type WingifyAudienceJSON = {
  d: {
    event: {
      name: 'wingify_integration'
      time: number
      props: {
        action: 'audience_entered' | 'audience_exited'
        audienceName: string
        audienceId: string
        identifier: string
        accountId: number
        integration: 'segment'
      }
    }
  }
}
