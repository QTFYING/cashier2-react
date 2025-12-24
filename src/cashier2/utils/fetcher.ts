import type { HttpClient } from '../types';

export const createDefaultFetcher = function (): HttpClient {
  return {
    get: (url, config) => {
      return fetch(url, { method: 'GET', ...config }).then((r) => r.json());
    },
    post: (url, body, config) => {
      return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', ...config?.headers },
        ...config,
      }).then((r) => r.json());
    },
  };
};
