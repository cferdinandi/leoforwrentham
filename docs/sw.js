let version = 'l4w_20250225';

// Cache IDs
let coreID = version + '_core';
let pageID = version + '_pages';
let imgID = version + '_img';
let cacheIDs = [coreID, pageID, imgID];

// Max number of files in cache
let limits = {
	pages: 35,
	imgs: 20
};

// Font files
let fontFiles = [
	'https://leoforwrentham.com/fonts/noto-sans-v38-latin-700.woff2',
	'https://leoforwrentham.com/fonts/noto-sans-v38-latin-700italic.woff2',
	'https://leoforwrentham.com/fonts/noto-sans-v38-latin-italic.woff2',
	'https://leoforwrentham.com/fonts/noto-sans-v38-latin-regular.woff2',
	'https://leoforwrentham.com/fonts/oswald-v53-latin-700.woff2'
];








//
// Methods
//

/**
 * Remove cached items over a certain number
 * @param  {String}  key The cache key
 * @param  {Integer} max The max number of items allowed
 */
function trimCache (key, max) {
	caches.open(key).then(function (cache) {
		cache.keys().then(function (keys) {
			if (keys.length <= max) return;
			cache.delete(keys[0]).then(function () {
				trimCache(key, max);
			});
		});
	});
}


//
// Event Listeners
//

// On install, cache some stuff
self.addEventListener('install', function (event) {
	self.skipWaiting();
	event.waitUntil(caches.open(coreID).then(function (cache) {
		cache.add(new Request('/offline/'));
		cache.add(new Request('/img/favicon.ico'));
		fontFiles.forEach(function (file) {
			cache.add(new Request(file));
		});
		return cache;
	}));
});

// On version update, remove old cached files
self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (key) {
			return !cacheIDs.includes(key);
		}).map(function (key) {
			return caches.delete(key);
		}));
	}).then(function () {
		return self.clients.claim();
	}));
});

// listen for requests
self.addEventListener('fetch', function (event) {

	// Get the request
	let request = event.request;

	// Bug fix
	// https://stackoverflow.com/a/49719964
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

	// Ignore non-GET requests
	if (request.method !== 'GET') return;

	// HTML files
	// Network-first
	if (request.headers.get('Accept').includes('text/html')) {
		event.respondWith(
			fetch(request).then(function (response) {
				if (response.type !== 'opaque') {
					let copy = response.clone();
					event.waitUntil(caches.open(pageID).then(function (cache) {
						return cache.put(request, copy);
					}));
				}
				return response;
			}).catch(function (error) {
				return caches.match(request).then(function (response) {
					return response || caches.match('/offline/');
				});
			})
		);
		return;
	}

	// Images & Fonts
	// Offline-first
	if (request.headers.get('Accept').includes('image') || request.url.includes('.woff2')) {
		event.respondWith(
			caches.match(request).then(function (response) {
				return response || fetch(request).then(function (response) {

					// If an image, stash a copy of this image in the images cache
					if (request.headers.get('Accept').includes('image')) {
						let copy = response.clone();
						event.waitUntil(caches.open(imgID).then(function (cache) {
							return cache.put(request, copy);
						}));
					}

					// Return the requested file
					return response;

				});
			})
		);
	}

});

// Trim caches over a certain size
self.addEventListener('message', function (event) {
	if (event.data !== 'cleanUp') return;
	trimCache(pageID, limits.pages);
	trimCache(imgID, limits.imgs);
});