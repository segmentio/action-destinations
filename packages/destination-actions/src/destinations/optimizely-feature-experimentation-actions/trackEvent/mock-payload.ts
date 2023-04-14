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
              timestamp: 1681386912136,
              uuid: 'ee4b4f2c-06cc-4f2b-9334-bdd29fe4d63d',
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
          value: false
        }
      ]
    }
  ]
}
