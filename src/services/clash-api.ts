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

class ClashApiClient {
  private getBaseUrl() {
    return useClashStore().baseUrl();
  }

  private getHeaders() {
    return useClashStore().headers();
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`Clash API error: ${res.status} ${res.statusText}`);
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
