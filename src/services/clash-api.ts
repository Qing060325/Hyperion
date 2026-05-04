// ==========================================
// Clash HTTP API Client
// ==========================================

import type {
  ClashVersion,
  ClashConfig,
  ProxyMap,
  ProxyInfo,
  RulesData,
  ConnectionsData,
  ProxyProviders,
  RuleProviders,
  DelayResult,
  DNSQueryResult,
} from "../types/clash";
import { useClashStore } from "../stores/clash";

// 统一错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 带 timeout 和 retry 的请求封装
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; retries?: number } = {},
): Promise<Response> {
  const { timeout = 8000, retries = 1, ...fetchOpts } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, { ...fetchOpts, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) {
        throw new ApiError(
          err instanceof DOMException && err.name === "AbortError"
            ? `请求超时 (${timeout}ms): ${url}`
            : `网络错误: ${url}`,
          undefined,
          url,
        );
      }
      // 指数退避
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new ApiError("unreachable");
}

class ClashApiClient {
  private getBaseUrl() {
    return useClashStore().baseUrl();
  }

  private getHeaders() {
    return useClashStore().headers();
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const res = await fetchWithTimeout(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
      timeout: 8000,
      retries: 1,
    });
    if (!res.ok) {
      throw new ApiError(
        `API 错误: ${res.status} ${res.statusText}`,
        res.status,
        path,
      );
    }
    return res.json();
  }

  // Version
  async getVersion(): Promise<ClashVersion> {
    return this.request("/version");
  }

  // Config
  async getConfig(): Promise<ClashConfig> {
    return this.request("/configs");
  }

  async patchConfig(data: Partial<ClashConfig>): Promise<void> {
    await fetch(`${this.getBaseUrl()}/configs`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify({ path: data }),
    });
  }

  async reloadConfig(path: string, payload?: string): Promise<void> {
    await fetch(
      `${this.getBaseUrl()}/configs?force=true`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ path, payload }),
      }
    );
  }

  async updateGeoData(): Promise<void> {
    await fetch(`${this.getBaseUrl()}/configs/geo`, {
      method: "POST",
      headers: this.getHeaders(),
    });
  }

  async restart(): Promise<void> {
    await fetch(`${this.getBaseUrl()}/restart`, {
      method: "POST",
      headers: this.getHeaders(),
    });
  }

  // Proxies
  async getProxies(): Promise<ProxyMap> {
    return this.request("/proxies");
  }

  async getProxy(name: string): Promise<ProxyInfo> {
    return this.request(`/proxies/${encodeURIComponent(name)}`);
  }

  async selectProxy(group: string, name: string): Promise<void> {
    await fetch(
      `${this.getBaseUrl()}/proxies/${encodeURIComponent(group)}`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ name }),
      }
    );
  }

  async testDelay(
    name: string,
    url = "https://www.gstatic.com/generate_204",
    timeout = 5000
  ): Promise<DelayResult> {
    const res = await fetch(
      `${this.getBaseUrl()}/proxies/${encodeURIComponent(name)}/delay?url=${encodeURIComponent(url)}&timeout=${timeout}`,
      {
        headers: this.getHeaders(),
      }
    );
    return res.json();
  }

  // Providers
  async getProxyProviders(): Promise<ProxyProviders> {
    return this.request("/providers/proxies");
  }

  async updateProxyProvider(name: string): Promise<void> {
    await fetch(`${this.getBaseUrl()}/providers/proxies/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: this.getHeaders(),
    });
  }

  async healthCheckProvider(name: string): Promise<void> {
    await fetch(
      `${this.getBaseUrl()}/providers/proxies/${encodeURIComponent(name)}/healthcheck`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );
  }

  async getRuleProviders(): Promise<RuleProviders> {
    return this.request("/providers/rules");
  }

  async updateRuleProvider(name: string): Promise<void> {
    await fetch(`${this.getBaseUrl()}/providers/rules/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: this.getHeaders(),
    });
  }

  // Rules
  async getRules(): Promise<RulesData> {
    return this.request("/rules");
  }

  // Connections
  async getConnections(): Promise<ConnectionsData> {
    return this.request("/connections");
  }

  async closeConnection(id: string): Promise<void> {
    await fetch(`${this.getBaseUrl()}/connections/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
  }

  async closeAllConnections(): Promise<void> {
    await fetch(`${this.getBaseUrl()}/connections`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
  }

  // DNS
  async dnsQuery(name: string, type = "A"): Promise<DNSQueryResult> {
    return this.request(`/dns/query?name=${encodeURIComponent(name)}&type=${type}`);
  }

  // Flush FakeIP
  async flushFakeIP(): Promise<void> {
    await fetch(`${this.getBaseUrl()}/cache/fakeip/flush`, {
      method: "POST",
      headers: this.getHeaders(),
    });
  }
}

export const clashApi = new ClashApiClient();
