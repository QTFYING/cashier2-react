// --- HTTP 辅助方法 ---

import type { HttpClient } from '../types';

export const createDefaultFetcher = function (): HttpClient {
  return {
    get: (url) => fetch(url).then((r) => r.json()),
    post: (url, body) => fetch(url, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json()),
  };
};
