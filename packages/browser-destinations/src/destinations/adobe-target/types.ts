export type Adobe = {
  target: Target
}

type Target = {
  trackEvent: Function
  triggerView: Function
}
