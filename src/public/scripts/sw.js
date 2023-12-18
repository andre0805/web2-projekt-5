import { del, entries } from "../index_db.js";

const cacheName = "cache-v8";

const filesToCache = [
    '/',
    '../manifest.json',
    '../views/new_post.ejs',
    '../views/offline.html',
    '../views/not_found.ejs',
    '../styles/index.css',
    '../styles/posts.css',
    '../styles/new_post.css',
    '../styles/offline.css',
    '../styles/not_found.css',
    '../scripts/index.js',
    '../scripts/posts.js',
    '../scripts/new_post.js',
    '../assets/favicon.ico',
    '../uploads/default.png'
]

self.addEventListener("install", (event) => {
    console.log("Installing service worker...");
    
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener("activate", (event) => {
    console.log("Activating new service worker...");

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cn) => {
                    if (cn !== cacheName) {
                        return caches.delete(cn);
                    }
                })
            );
        })
    );
});

self.addEventListener("fetch", (event) => {
    console.log("Fetch intercepted for: ", event.request.url);

    // if (!event.request.url.startsWith('http')) return;
    
    if (
        event.request.url.includes('/') ||
        event.request.url.includes('auth0') ||
        event.request.url.includes('/callback') ||
        event.request.url.includes('/login') ||
        event.request.url.includes('/logout'))
    {
        // Skip the service worker for authentication requests
        return;
    }

    if (event.request.url.includes(".jpg")) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log("Found in cache: ", event.request.url);
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        const responseToCache = response.clone();

                        if (response.status === 404) {
                            return caches.match("uploads/default.png");
                        }

                        caches.open(cacheName).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.log(error);
                        return caches.match("offline.html");
                    })
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener("sync", function (event) {
    console.log("Background sync!", event);

    if (event.tag === "sync-new-post") {
        event.waitUntil(syncPosts());
    }
});

let syncPosts = async function () {
    entries().then((entries) => {
        entries.forEach((entry) => {
            const formData = new FormData();
            formData.append("id", entry[1].id);
            formData.append("title", entry[1].title);
            formData.append("description", entry[1].description);
            formData.append("image", entry[1].image);

            fetch("/posts", {
                method: "POST",
                body: formData
            })
                .then(function (res) {
                    if (res.ok) {
                        console.log("Deleting from IndexDB: ", entry[1].id);
                        del(entry[1].id);
                    } else {
                        console.log(res);
                    }
                })
                .catch((error) => {
                    console.log('Error:', error);
                });
        });
    });
};