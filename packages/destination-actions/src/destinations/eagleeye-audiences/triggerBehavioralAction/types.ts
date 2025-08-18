export interface BehavioralActionPayload {
  type: 'services/trigger'
  body: {
    identityValue: string
    walletTransaction?: {
      reference: string
    }
    triggers: Array<{
      reference: string
    }>
  }
}
