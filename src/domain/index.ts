import { HttpClient } from './http/HttpClient';
import { ClashRepository } from './repositories/ClashRepository';

const STORAGE_KEY = "hyperion-connection";

function syncBaseURLFromStorage(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const conn = JSON.parse(raw);
      const useProxy = conn?.useProxy ?? true;
      if (useProxy) {
        return `${window.location.origin}/api`;
      }
      const host = conn?.host ?? window.location.hostname;
      const port = conn?.port ?? (window.location.port || 80);
      return `http://${host}:${port}`;
    }
  } catch {
    // ignore
  }
  return `http://${window.location.hostname}:${window.location.port || 80}`;
}

export const httpClient = new HttpClient({ baseURL: syncBaseURLFromStorage(), timeout: 8000 });
export const clashRepository = new ClashRepository(httpClient);

export function configureDomainBaseURL(url: string) {
  httpClient.setBaseURL(url);
}

export function syncDomainBaseURL() {
  httpClient.setBaseURL(syncBaseURLFromStorage());
}

export { HttpClient };
