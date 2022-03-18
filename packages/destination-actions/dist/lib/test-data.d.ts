import { ActionDefinition, DestinationDefinition } from '@segment/actions-core'
export declare function generateTestData(
  seedName: string,
  destination: DestinationDefinition<any>,
  action: ActionDefinition<any>,
  isRequiredOnly: boolean
): any[]
