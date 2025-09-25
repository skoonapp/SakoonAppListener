import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';

// This placeholder will be replaced by the list of assets to cache during the build process.
precacheAndRoute(self.__WB_MANIFEST || []);

// --- SPA Navigation Fallback ---
// This ensures that all navigation requests are handled by the single-page app's index.html.
// It's crucial for offline functionality and a true app-like feel.
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);


// These lines ensure the service worker takes control of the page immediately
// and that new versions of the app activate without waiting.
self.skipWaiting();
clientsClaim();

// --- Firebase Push Notifications Logic ---
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDgrba11-ZmbE6f3BIYfNc_tKLv32osWuU",
    authDomain: "sakoonapp-9574c.firebaseapp.com",
    databaseURL: "https://sakoonapp-9574c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sakoonapp-9574c",
    storageBucket: "sakoonapp-9574c.appspot.com",
    messagingSenderId: "747287490572",
    appId: "1:747287490572:web:7053dc7758c622498a3e29",
    measurementId: "G-6VD83ZC2HP"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[sw.js] Received background message ", payload);
  const { type, userName, callId, userAvatar, silent, chatId } = payload.data || {};
  const isSilent = silent === 'true';

  if (type === 'incoming_call') {
      const notificationTitle = `Incoming Call`;
      const notificationOptions = {
          body: `${userName || 'A user'} wants to talk.`,
          icon: userAvatar || "/icon-192.png",
          tag: callId || 'incoming-call',
          data: payload.data,
          actions: [
              { action: 'accept', title: 'Accept' },
              { action: 'reject', title: 'Reject' }
          ],
          requireInteraction: true,
          silent: isSilent,
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
  } else if (type === 'new_message') {
      const notificationTitle = payload.notification?.title || `New message from ${userName || 'a user'}`;
      const notificationOptions = {
          body: payload.notification?.body || "",
          icon: payload.notification?.image || userAvatar || "/icon-192.png",
          data: payload.data,
          tag: chatId || 'new-message', // Use chatId to stack/replace notifications
          silent: isSilent,
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const callId = event.notification.data?.callId;
  const chatId = event.notification.data?.chatId;

  if (event.action === 'accept' && callId) {
      const targetUrl = new URL(`/#/call/${callId}`, self.location.origin).href;
      event.waitUntil(clients.openWindow(targetUrl));
  } else if (event.action === 'reject') {
      console.log('Call rejected by listener from notification.');
      if (callId) {
          // Promise to update Firestore
          const rejectCallPromise = firebase.firestore().collection('calls').doc(callId).get().then(doc => {
              // Check if the call is still in a pending-like state before rejecting to avoid race conditions
              if (doc.exists && (doc.data().status !== 'completed' && doc.data().status !== 'rejected')) {
                  return doc.ref.update({ status: 'rejected' }).then(() => {
                      console.log(`Call ${callId} status updated to rejected.`);
                  });
              } else {
                  console.log(`Call ${callId} was already handled or does not exist.`);
              }
          }).catch(err => {
              console.error(`Failed to reject call ${callId}:`, err);
          });
          // Ensure the service worker lives long enough to perform the update.
          event.waitUntil(rejectCallPromise);
      }
  } else {
    // Default click action if not an action button
    let defaultPath = '/#/';
    if (callId) {
      defaultPath = `/#/call/${callId}`;
    } else if (chatId) {
      defaultPath = `/#/chat`;
    }
    
    const targetUrl = new URL(event.notification.data?.url || defaultPath, self.location.origin).href;
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window for the app is already open, focus it and navigate to the call.
        for (const client of clientList) {
          if (client.url.includes('/#/') && 'focus' in client) {
            return client.navigate(targetUrl).then(c => c.focus());
          }
        }
        // Otherwise, open a new window.
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});