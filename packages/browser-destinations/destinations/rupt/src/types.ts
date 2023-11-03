interface Redirects {
  logout_url?: string
  new_account_url: string
  success_url?: string
  suspended_url?: string
}

interface DetachConfig {
  client_id: string
  secret?: string
  device: string
  account?: string
  domain?: string
}
export interface LimitConfig {
  /**
   * @description The maximum devices that can be attached to a single account.
   */
  overall_device_limit?: number
  /**
   * @description The number of people allowed to use the same account. This is useful for family plans. If Rupt detects more than this number of people using the same account (even if not using at the same time), it will trigger the on_limit_exceeded callback.
   */
  people_limit?: number
}

export interface AttachResponse {
  success: boolean
  attached_devices: number
  device_id: string
  default_device_limit: number
  block_over_usage: boolean
  suspended?: boolean
  access: string
  identity: string
}

export interface AttachConfig {
  client_id: string
  secret?: string
  account: string
  email?: string
  phone?: string
  metadata?: object
  debug?: boolean
  identity?: string
  include_page?: boolean
  limit_config?: LimitConfig
  redirect_urls?: Redirects
  on_challenge?: () => boolean
  on_limit_exceeded?: () => void
  domain?: string
}

type attach = ({
  client_id,
  secret,
  account,
  email,
  phone,
  metadata,
  debug,
  identity,
  include_page,
  domain,
  limit_config,
  redirect_urls,
  on_challenge,
  on_limit_exceeded
}: AttachConfig) => Promise<AttachResponse | null>

type detach = ({ device, account, client_id, secret, domain }: DetachConfig) => Promise<any>

export default interface Rupt {
  attach: attach
  detach: detach
}
