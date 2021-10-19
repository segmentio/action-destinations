import type appboy from '@braze/web-sdk'

/* eslint-disable no-useless-escape */
// prettier-ignore
export function initialize(
  version: string,
  apiKey: string,
  baseConfig: appboy.InitializationOptions
): typeof appboy {
  /* eslint-disable */
  // @ts-expect-error expect errors on minified code
  +function(a,p,P,b,y){a.appboy={};a.appboyQueue=[];for(var s="DeviceProperties Card Card.prototype.dismissCard Card.prototype.removeAllSubscriptions Card.prototype.removeSubscription Card.prototype.subscribeToClickedEvent Card.prototype.subscribeToDismissedEvent Banner CaptionedImage ClassicCard ControlCard ContentCards ContentCards.prototype.getUnviewedCardCount Feed Feed.prototype.getUnreadCardCount ControlMessage InAppMessage InAppMessage.SlideFrom InAppMessage.ClickAction InAppMessage.DismissType InAppMessage.OpenTarget InAppMessage.ImageStyle InAppMessage.Orientation InAppMessage.TextAlignment InAppMessage.CropType InAppMessage.prototype.closeMessage InAppMessage.prototype.removeAllSubscriptions InAppMessage.prototype.removeSubscription InAppMessage.prototype.subscribeToClickedEvent InAppMessage.prototype.subscribeToDismissedEvent InAppMessage.fromJson FullScreenMessage ModalMessage HtmlMessage SlideUpMessage User User.Genders User.NotificationSubscriptionTypes User.prototype.addAlias User.prototype.addToCustomAttributeArray User.prototype.addToSubscriptionGroup User.prototype.getUserId User.prototype.incrementCustomUserAttribute User.prototype.removeFromCustomAttributeArray User.prototype.removeFromSubscriptionGroup User.prototype.setAvatarImageUrl User.prototype.setCountry User.prototype.setCustomLocationAttribute User.prototype.setCustomUserAttribute User.prototype.setDateOfBirth User.prototype.setEmail User.prototype.setEmailNotificationSubscriptionType User.prototype.setFirstName User.prototype.setGender User.prototype.setHomeCity User.prototype.setLanguage User.prototype.setLastKnownLocation User.prototype.setLastName User.prototype.setPhoneNumber User.prototype.setPushNotificationSubscriptionType InAppMessageButton InAppMessageButton.prototype.removeAllSubscriptions InAppMessageButton.prototype.removeSubscription InAppMessageButton.prototype.subscribeToClickedEvent display display.automaticallyShowNewInAppMessages display.destroyFeed display.hideContentCards display.showContentCards display.showFeed display.showInAppMessage display.toggleContentCards display.toggleFeed changeUser destroy getDeviceId initialize isPushBlocked isPushGranted isPushPermissionGranted isPushSupported logCardClick logCardDismissal logCardImpressions logContentCardsDisplayed logCustomEvent logFeedDisplayed logInAppMessageButtonClick logInAppMessageClick logInAppMessageHtmlClick logInAppMessageImpression logPurchase openSession registerAppboyPushMessages removeAllSubscriptions removeSubscription requestContentCardsRefresh requestFeedRefresh requestImmediateDataFlush resumeWebTracking setLogger setSdkAuthenticationSignature stopWebTracking subscribeToContentCardsUpdates subscribeToFeedUpdates subscribeToInAppMessage subscribeToNewInAppMessages subscribeToSdkAuthenticationFailures toggleAppboyLogging trackLocation unregisterAppboyPushMessages wipeData".split(" "),i=0;i<s.length;i++){for(var m=s[i],k=a.appboy,l=m.split("."),j=0;j<l.length-1;j++)k=k[l[j]];k[l[j]]=(new Function("return function "+m.replace(/\./g,"_")+"(){window.appboyQueue.push(arguments); return true}"))()}window.appboy.getCachedContentCards=function(){return new window.appboy.ContentCards};window.appboy.getCachedFeed=function(){return new window.appboy.Feed};window.appboy.getUser=function(){return new window.appboy.User};(y=p.createElement(P)).type='text/javascript';
    // @ts-expect-error expect errors on minified code
    y.src=`https://js.appboycdn.com/web-sdk/${version}/appboy.min.js`;
    // @ts-expect-error expect errors on minified code
    y.async=1;(b=p.getElementsByTagName(P)[0]).parentNode.insertBefore(y,b)
  }(window,document,'script');
  /* eslint-enable */

  window.appboy.initialize(apiKey, {
    allowCrawlerActivity: baseConfig.allowCrawlerActivity,
    allowUserSuppliedJavascript: baseConfig.allowUserSuppliedJavascript,
    appVersion: baseConfig.appVersion,
    baseUrl: baseConfig.baseUrl,
    contentSecurityNonce: baseConfig.contentSecurityNonce,
    devicePropertyAllowlist: baseConfig.devicePropertyAllowlist,
    disablePushTokenMaintenance: baseConfig.disablePushTokenMaintenance,
    doNotLoadFontAwesome: baseConfig.doNotLoadFontAwesome,
    enableLogging: baseConfig.enableLogging,
    enableSdkAuthentication: baseConfig.enableSdkAuthentication,
    inAppMessageZIndex: baseConfig.inAppMessageZIndex,
    localization: baseConfig.localization,
    manageServiceWorkerExternally: baseConfig.manageServiceWorkerExternally,
    minimumIntervalBetweenTriggerActionsInSeconds: baseConfig.minimumIntervalBetweenTriggerActionsInSeconds,
    noCookies: baseConfig.noCookies,
    openInAppMessagesInNewTab: baseConfig.openInAppMessagesInNewTab,
    openCardsInNewTab: baseConfig.openCardsInNewTab,
    requireExplicitInAppMessageDismissal: baseConfig.requireExplicitInAppMessageDismissal,
    safariWebsitePushId: baseConfig.safariWebsitePushId,
    serviceWorkerLocation: baseConfig.serviceWorkerLocation,
    sessionTimeoutInSeconds: baseConfig.sessionTimeoutInSeconds
  })

  window.appboy.openSession()

  return window.appboy
}
