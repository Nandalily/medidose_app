const CACHE_NAME = "medidose-development-v1";

const FILES = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json"
];


self.addEventListener(
    "install",
    event => {

        self.skipWaiting();

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(FILES);

                })

        );

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys => {

                    return Promise.all(

                        keys.map(key => {

                            if (
                                key !== CACHE_NAME
                            ) {

                                return caches.delete(
                                    key
                                );

                            }

                        })

                    );

                })

        );

        self.clients.claim();

    }
);


/*
   Development approach:

   Always try the network first.

   This means changes to your HTML/CSS/JS
   are picked up much more easily.
*/

self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            fetch(event.request)
                .then(response => {

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

    }
);