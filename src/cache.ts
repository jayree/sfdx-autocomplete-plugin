/*
 * Copyright 2025, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import fs from 'fs-extra';

export async function updateCache(cachePath: string, cache: string[]): Promise<void> {
  await fs.ensureFile(cachePath);
  await fs.writeJSON(cachePath, cache);
}

// eslint-disable-next-line no-underscore-dangle
function _isStale(cachePath: string, cacheDuration: number): boolean {
  const past = new Date();
  past.setSeconds(past.getSeconds() - cacheDuration);
  return past.getTime() > _mtime(cachePath).getTime();
}

// eslint-disable-next-line no-underscore-dangle
function _mtime(f: string): Date {
  return fs.statSync(f).mtime;
}

export async function fetchCache(
  cachePath: string,
  cacheDuration: number,
  skipCache: boolean,
  options: {
    cacheFn: () => Promise<string[]>;
  },
): Promise<string[]> {
  const cachePresent = fs.existsSync(cachePath);
  if (cachePresent && !skipCache && !_isStale(cachePath, cacheDuration)) {
    return fs.readJSON(cachePath) as Promise<string[]>;
  }
  const cache = await options.cacheFn();
  // TODO: move this to a fork
  if (!skipCache) {
    await updateCache(cachePath, cache);
  }
  return cache;
}
