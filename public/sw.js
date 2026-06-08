const CACHE_NAME = "iams-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
];

// Install event - cache necessary files
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install event");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching app assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate event");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push event received");

  let notificationData = {
    title: "IAMS Notification",
    body: "You have a new notification",
    icon: "/logo-192.png",
    badge: "/logo-192.png",
    tag: "iams-notification",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
      };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: false,
      data: notificationData.data,
    })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification clicked:", event.notification.tag);

  event.notification.close();

  const urlToOpen = new URL("/", self.location.origin);
  if (event.notification.data && event.notification.data.url) {
    urlToOpen.pathname = event.notification.data.url;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen.toString() && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window/tab if app not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen.toString());
        }
      })
  );
});

// Message event - handle messages from app
self.addEventListener("message", (event) => {
  console.log("[ServiceWorker] Message received:", event.data);

  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { notification } = event.data;
    self.registration.showNotification(notification.title, notification.options);
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API calls - always go to network
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => {
          // Return offline response if needed
          return new Response("Network error", { status: 503 });
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return a basic offline page if both cache and network fail
          return new Response("You are offline", { status: 503 });
        });
    })
  );
});
