import { DependsOnConditions } from '@segment/actions-core/destination-kit/types'
import { DynamicFieldItem } from '@segment/actions-core'

export const SUPPORTED_HUBSPOT_OBJECT_TYPES = [
  { label: 'Contact', value: 'contact' },
  { label: 'Company', value: 'company' },
  { label: 'Deal', value: 'deal' },
  { label: 'Ticket', value: 'ticket' }
]

export const DEPENDS_ON_OBJECT_TYPE_CONTACT: DependsOnConditions = {
  match: 'all',
  conditions: [
    {
      fieldKey: 'object_type',
      operator: 'is',
      value: 'contact'
    }
  ]
}

export const DEFAULT_CUSTOM_EVENT_PROPERTIES: Array<DynamicFieldItem> = [
  {
    label: `Asset description - string`,
    value: 'hs_asset_description'
  },
  {
    label: `Asset type - string`,
    value: 'hs_asset_type'
  },
  {
    label: `Browser - string`,
    value: 'hs_browser'
  },
  {
    label: `Campaign ID - string`,
    value: 'hs_campaign_id'
  },
  {
    label: `City - string`,
    value: 'hs_city'
  },
  {
    label: `Country - string`,
    value: 'hs_country'
  },
  {
    label: `Device name - string`,
    value: 'hs_device_name'
  },
  {
    label: `Device type - string`,
    value: 'hs_device_type'
  },
  {
    label: `Element class - string`,
    value: 'hs_element_class'
  },
  {
    label: `Element ID - string`,
    value: 'hs_element_id'
  },
  {
    label: `Element text - string`,
    value: 'hs_element_text'
  },
  {
    label: `Language - enumeration`,
    value: 'hs_language'
  },
  {
    label: `Link href - string`,
    value: 'hs_link_href'
  },
  {
    label: `Operating system - string`,
    value: 'hs_operating_system'
  },
  {
    label: `Operating version - string`,
    value: 'hs_operating_version'
  },
  {
    label: `Page content type - enumeration`,
    value: 'hs_page_content_type'
  },
  {
    label: `Page ID - string`,
    value: 'hs_page_id'
  },
  {
    label: `Page title - string`,
    value: 'hs_page_title'
  },
  {
    label: `Page URL - string`,
    value: 'hs_page_url'
  },
  {
    label: `Parent module ID - string`,
    value: 'hs_parent_module_id'
  },
  {
    label: `Referrer - string`,
    value: 'hs_referrer'
  },
  {
    label: `Region - string`,
    value: 'hs_region'
  },
  {
    label: `Screen height - number`,
    value: 'hs_screen_height'
  },
  {
    label: `Screen width - number`,
    value: 'hs_screen_width'
  },
  {
    label: `Touchpoint source - string`,
    value: 'hs_touchpoint_source'
  },
  {
    label: `Tracking name - string`,
    value: 'hs_tracking_name'
  },
  {
    label: `User agent - string`,
    value: 'hs_user_agent'
  },
  {
    label: `UTM Campaign - string`,
    value: 'hs_utm_campaign'
  },
  {
    label: `UTM Content - string`,
    value: 'hs_utm_content'
  },
  {
    label: `UTM Medium - string`,
    value: 'hs_utm_medium'
  },
  {
    label: `UTM Source - string`,
    value: 'hs_utm_source'
  },
  {
    label: `UTM Term - string`,
    value: 'hs_utm_term'
  }
]
