/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs-extra';
export async function updateCache(cachePath, cache) {
    await fs.ensureFile(cachePath);
    await fs.writeJSON(cachePath, cache);
}
// eslint-disable-next-line no-underscore-dangle
function _isStale(cachePath, cacheDuration) {
    const past = new Date();
    past.setSeconds(past.getSeconds() - cacheDuration);
    return past.getTime() > _mtime(cachePath).getTime();
}
// eslint-disable-next-line no-underscore-dangle
function _mtime(f) {
    return fs.statSync(f).mtime;
}
export async function fetchCache(cachePath, cacheDuration, skipCache, options) {
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
//# sourceMappingURL=cache.js.map