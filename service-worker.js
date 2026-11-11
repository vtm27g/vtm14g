/* VTM14 offline asset cache. Bump CACHE_NAME whenever shipped assets change. */
"use strict";
var CACHE_NAME = "vtm14-static-v3";
var PRECACHE = [
  "./", "./index.html", "./jb.html", "./style.css", "./launch.js",
  "./service-worker.js", "./meme.png", "./vtm-gaming-bg.png",
  "./jb.js", "./core.js", "./mem.js", "./int64.js", "./ps4_offsets.js",
  "./afterglow.js", "./patchset-1400.bin", "./patchset-1352.bin",
  "./hen.bin", "./goldhen.bin"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(PRECACHE);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf("vtm14-static-") === 0 && key !== CACHE_NAME;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.hostname.indexOf("workers.dev") !== -1) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match("./index.html");
      });
    }));
    return;
  }
  event.respondWith(caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    });
  }));
});
