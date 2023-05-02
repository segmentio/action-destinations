import { Analytics, Context } from '@segment/analytics-next'
import screebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'group',
    name: 'Group',
    enabled: true,
    subscribe: 'type = "group"',
    mapping: {
      groupId: {
        '@path': '$.groupId'
      },
      groupType: {
        '@path': '$.traits.group_type'
      },
      properties: {
        '@path': '$.traits'
      }
    }
  }
]

describe('group', () => {
  beforeAll(() => {
    jest.mock('@segment/browser-destination-runtime/load-script', () => ({
      loadScript: (_src: any, _attributes: any) => {}
    }))
    jest.mock('@segment/browser-destination-runtime/resolve-when', () => ({
      resolveWhen: (_fn: any, _timeout: any) => {}
    }))
  })
  test('it maps event parameters correctly to group function ', async () => {
    const [group] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.group, 'perform')
    await group.load(Context.system(), {} as Analytics)

    await group.group?.(
      new Context({
        type: 'group',
        groupId: 'group-name',
        traits: {
          plan: 'free'
        }
      })
    )

    expect(destination.actions.group.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          groupId: 'group-name',
          properties: {
            plan: 'free'
          }
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity.group.assign', undefined, 'group-name', { plan: 'free' }]
    ])
  })
  test('it maps event parameters correctly to group function with group type', async () => {
    const [group] = await screebDestination({
      websiteId: 'fake-website-id',
      subscriptions
    })

    jest.spyOn(destination.actions.group, 'perform')
    await group.load(Context.system(), {} as Analytics)

    await group.group?.(
      new Context({
        type: 'group',
        groupId: 'group-name',
        traits: {
          plan: 'free',
          group_type: 'cohort'
        }
      })
    )

    expect(destination.actions.group.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          groupId: 'group-name',
          groupType: 'cohort',
          properties: {
            plan: 'free',
            group_type: 'cohort'
          }
        }
      })
    )

    expect(window.$screeb.q).toStrictEqual([
      ['init', 'fake-website-id'],
      ['identity.group.assign', 'cohort', 'group-name', { plan: 'free', group_type: 'cohort' }]
    ])
  })
})
