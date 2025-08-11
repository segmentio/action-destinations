```diff
--- OldCode.ts
+++ NewCode.ts
@@
-    testAuthentication: (request, data) => {
-      return request(`https://developers.yotpo.com/v2/${data.settings.store_id}/info`, {
+    testAuthentication: (request, data) => {
+      return request(`https://developers.yotpo.com/v23/${data.settings.store_id}/info`, {
@@
-    refreshAccessToken: async (request, data) => {
-      const promise = await request<AccessTokenResponse>(`https://developers.yotpo.com/v2/oauth/token`, {
+    refreshAccessToken: async (request, data) => {
+      const promise = await request<AccessTokenResponse>(`https://developers.yotpo.com/v23/oauth/token`, {
@@
-  extendRequest({ auth }) {
-    return {
-      headers: {
-        'X-Yotpo-Token': `${auth?.accessToken}`
-      }
-    }
-  },
+  extendRequest({ auth }) {
+    return {
+      headers: {
+        'X-Yotpo-Token': `${auth?.accessToken}`
+      }
+    }
+  },
```