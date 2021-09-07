"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCache = exports.updateCache = void 0;
const fs = require("fs-extra");
// tslint:disable-next-line: no-any
async function updateCache(cachePath, cache) {
    await fs.ensureFile(cachePath);
    await fs.writeJSON(cachePath, cache);
}
exports.updateCache = updateCache;
// eslint-disable-next-line no-underscore-dangle
function _isStale(cachePath, cacheDuration) {
    const past = new Date();
    past.setSeconds(past.getSeconds() - cacheDuration);
    return past.getTime() > _mtime(cachePath).getTime();
}
// tslint:disable-next-line: no-any
// eslint-disable-next-line no-underscore-dangle
function _mtime(f) {
    return fs.statSync(f).mtime;
}
async function fetchCache(cachePath, cacheDuration, skipCache, 
// tslint:disable-next-line: no-any
options) {
    const cachePresent = fs.existsSync(cachePath);
    if (cachePresent && !skipCache && !_isStale(cachePath, cacheDuration)) {
        return fs.readJSON(cachePath);
    }
    const cache = await options.cacheFn();
    // TODO: move this to a fork
    if (!skipCache) {
        await updateCache(cachePath, cache);
    }
    return cache;
}
exports.fetchCache = fetchCache;
//# sourceMappingURL=cache.js.map