"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
// tslint:disable-next-line: no-any
async function updateCache(cachePath, cache) {
    await fs.ensureFile(cachePath);
    await fs.writeJSON(cachePath, cache);
}
exports.updateCache = updateCache;
function _isStale(cachePath, cacheDuration) {
    const past = new Date();
    past.setSeconds(past.getSeconds() - cacheDuration);
    return past.getTime() > _mtime(cachePath).getTime();
}
// tslint:disable-next-line: no-any
function _mtime(f) {
    return fs.statSync(f).mtime;
}
async function fetchCache(cachePath, cacheDuration, 
// tslint:disable-next-line: no-any
options) {
    const cachePresent = fs.existsSync(cachePath);
    if (cachePresent && !_isStale(cachePath, cacheDuration)) {
        return fs.readJSON(cachePath);
    }
    const cache = await options.cacheFn();
    // TODO: move this to a fork
    await updateCache(cachePath, cache);
    return cache;
}
exports.fetchCache = fetchCache;
//# sourceMappingURL=cache.js.map