import { Analytics, Context } from '@segment/analytics-next';
import brazeDestination, { destination } from '../index'

describe('braze.setSubscriptionGroups', () => {
  beforeEach(async () => {
    destination.actions.updateUserProfile.perform = jest.fn();
    jest.spyOn(destination.actions.setSubscriptionGroups, 'perform');
    jest.spyOn(destination, 'initialize');
  });

  test("Sets subscription groups when braze_subscription_groups are a trait of identify", async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'updateUserProfile',
          name: 'Log User',
          enabled: true,
          subscribe: 'type = "identify"',
          mapping: {
            subscriptionGroups: {
              '@path': '$.traits.braze_subscription_groups'
            }
          }
        }
      ]
    });

    await event.load(Context.system(), new Analytics({ writeKey: '123' }));
    const brazeSubscriptionGroups = [{
          "subscription_group_id": "5ertykiuyfjyttgkf",
          "subscription_state": "unsubscribed"
      }, {
          "subscription_group_id": "ytghkuguymjghb",
          "subscription_state": "unsubscribed"
    }];

    await event.identify?.(
      new Context({
        type: 'identify',
        traits: {
          braze_subscription_groups: brazeSubscriptionGroups
        }
      })
    );

     expect(destination.actions.setSubscriptionGroups.perform).toHaveBeenCalledWith(
      // expect.objectContaining({
      //   instance: expect.objectContaining({
      //     derp: expect.any(Function)
      //   })
      // }),

      expect.objectContaining({
        payload: {
          subscriptionGroups: brazeSubscriptionGroups
        }
      }),
     )
  });
});
