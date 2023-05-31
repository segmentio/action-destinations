import { dataFile } from './mock-dataFile'

export const payload = {
  account_id: dataFile.accountId,
  anonymize_ip: dataFile.anonymizeIP,
  client_name: 'Segment',
  enrich_decisions: true,
  visitors: [
    {
      snapshots: [
        {
          events: [
            {
              entity_id: '22020998834',
              key: 'Product List Clicked',
              revenue: 1000,
              tags: {}
            }
          ],
          decisions: []
        }
      ],
      visitor_id: 'user1234',
      attributes: [
        {
          entity_id: '18531090301',
          key: 'test',
          value: 'test',
          type: 'custom'
        }
      ]
    }
  ]
}

export const botFilteringPayload = {
  account_id: dataFile.accountId,
  anonymize_ip: dataFile.anonymizeIP,
  client_name: 'Segment',
  enrich_decisions: true,
  visitors: [
    {
      snapshots: [
        {
          events: [
            {
              entity_id: '22020998834',
              key: 'Product List Clicked',
              revenue: 1000,
              tags: {}
            }
          ],
          decisions: []
        }
      ],
      visitor_id: 'user1234',
      attributes: [
        {
          entity_id: '18531090301',
          key: 'test',
          value: 'test',
          type: 'custom'
        },
        {
          entity_id: '$opt_bot_filtering',
          key: '$opt_bot_filtering',
          type: 'custom',
          value: true
        }
      ]
    }
  ]
}
