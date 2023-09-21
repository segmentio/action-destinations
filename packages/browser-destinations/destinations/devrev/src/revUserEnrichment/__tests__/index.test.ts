import { Analytics, Context } from '@segment/analytics-next'
import revUserEnrichment from '..'

describe('DevRev.revUserEnrichment', () => {
  it('should enrich account and workspace ref', async () => {
    const mockUserTraits = {
      user_ref: 'USER-test',
      account_ref: 'ACC-test',
      workspace_ref: 'WOR-test'
    }

    const context = new Context({
      type: 'identify',
      traits: mockUserTraits
    })

    const analytics = {
      user: jest.fn(() => ({
        traits: jest.fn(() => mockUserTraits)
      }))
    } as any as Analytics

    await revUserEnrichment.perform(
      {},
      {
        settings: {},
        context,
        payload: {
          userRef: 'user_ref',
          accountRef: 'account_ref',
          workspaceRef: 'workspace_ref'
        },
        analytics
      }
    )

    expect(context.event.integrations).toHaveProperty('DevRev')
    expect(context.event.integrations).toHaveProperty('DevRev.userRef', mockUserTraits.user_ref)
    expect(context.event.integrations).toHaveProperty('DevRev.accountRef', mockUserTraits.account_ref)
    expect(context.event.integrations).toHaveProperty('DevRev.workspaceRef', mockUserTraits.workspace_ref)
  })

  it("should not enrich account and worskapce ref if they don't exist", async () => {
    const mockUserTraits = {
      randomTrait: 'random'
    }

    const context = new Context({
      type: 'identify',
      traits: mockUserTraits
    })

    const analytics = {
      user: jest.fn(() => ({
        traits: jest.fn(() => mockUserTraits)
      }))
    } as any as Analytics

    await revUserEnrichment.perform(
      {},
      {
        settings: {},
        context,
        payload: {
          userRef: 'userRef',
          accountRef: 'accountRef',
          workspaceRef: 'workspaceRef'
        },
        analytics
      }
    )

    expect(context.event.integrations).toBeUndefined
  })
})
