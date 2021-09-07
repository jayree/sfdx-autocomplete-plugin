import * as fs from 'fs-extra';

// tslint:disable-next-line: no-any
export async function updateCache(cachePath: string, cache: any) {
  await fs.ensureFile(cachePath);
  await fs.writeJSON(cachePath, cache);
}

// eslint-disable-next-line no-underscore-dangle
function _isStale(cachePath: string, cacheDuration: number): boolean {
  const past = new Date();
  past.setSeconds(past.getSeconds() - cacheDuration);
  return past.getTime() > _mtime(cachePath).getTime();
}

// tslint:disable-next-line: no-any
// eslint-disable-next-line no-underscore-dangle
function _mtime(f: any): Date {
  return fs.statSync(f).mtime;
}

export async function fetchCache(
  cachePath: string,
  cacheDuration: number,
  skipCache: boolean,
  // tslint:disable-next-line: no-any
  options: any
): Promise<string[]> {
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
