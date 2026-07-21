export interface RequestJSON {
  api_key: string
  
  device_identities: Array<{
    type: 'IDFA' | 'GAID'
    value: string
  }>

  audiences: [{
    audience_id: number
    audience_name: string
    action: 'add' | 'remove'
  }]
}