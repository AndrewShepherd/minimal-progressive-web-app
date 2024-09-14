const cacheName = 'v1'

async function addResourcesToCache() {
    const cache = await caches.open(cacheName);
    await cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/service-worker.js",
        "./manifest.json",
        "./icon/pumpkin.png"
    ]);
  };


self.addEventListener(
    "install",
    (event) => {
        console.log(`Service Worker handling the install Event`);
        const addResourcesPromise = addResourcesToCache();
        event.waitUntil(addResourcesPromise);
    }
);


// https://codesandbox.io/s/bncb2v?file=/sw.js
self.addEventListener(
    "fetch",
    (event) => {
        const responsePromise = (async() => {
              // First try to get the resource from the cache
                const responseFromCache = await caches.match(event.request);
                if (responseFromCache) {
                    console.log(`Service Worker fetch (${event.request.url}). Found cached response`);
                    return responseFromCache;
                }

                // Now try the preload response
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    console.log(`Service Worker fetch (${event.request.url}). Using preload response`);
                    const cache = await caches.open(cacheName);
                    await cache.put(event.request, event.preloadResponse.clone());
                    return preloadResponse;
                }

                // Next try to get the resource from the network
                try {
                    const responseFromNetwork = await fetch(event.request);
                    console.log(`Service Worker fetch (${event.request.url}). Retrieved response from network`);
                    const cache = await caches.open(cacheName);
                    await cache.put(event.request, responseFromNetwork.clone());
                    return responseFromNetwork;

                } catch (error) {
                    console.log(`Service Worker fetch (${event.request.url}). Failed to retrieve from network`);

                    return new Response('Network error happened', {
                        status: 408,
                        headers: { 'Content-Type': 'text/plain' },
                      });
                }

        })();
        event.respondWith(responsePromise);
    }
)