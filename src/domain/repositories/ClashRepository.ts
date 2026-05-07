import { HttpClient, HttpClientError } from "../http/HttpClient";

export { HttpClientError };

export interface VersionResponse {
  version: string;
  buildTime?: string;
  goVersion?: string;
}

export interface ProxyInfo {
  name: string;
  type: string;
  all?: string[];
  now?: string;
  history?: { delay: number; time: string }[];
  [key: string]: unknown;
}

export interface ProxyMap {
  proxies: Record<string, ProxyInfo>;
  [key: string]: unknown;
}

export interface Rule {
  type: string;
  payload: string;
  proxy: string;
}

export interface RulesResponse {
  rules: Rule[];
}

export interface ConnectionInfo {
  id: string;
  metadata: Record<string, string>;
  upload: number;
  download: number;
  start: string;
  chains: string[];
  rule: string;
  rulePayload: string;
}

export interface DNSResponse {
  Status: number;
  Question: { Name: string; Type: number }[];
  Answer?: { name: string; type: number; TTL: number; data: string }[];
}

export class ClashRepository {
  constructor(private http: HttpClient) {}

  readonly version = {
    get: (): Promise<VersionResponse> => this.http.get("/version"),
  };

  readonly config = {
    get: (): Promise<unknown> => this.http.get("/configs"),
    patch: (data: unknown): Promise<unknown> => this.http.patch("/configs", data),
    reload: (path = "", payload?: string): Promise<unknown> =>
      this.http.put("/configs?force=true", { path, payload }),
    geo: (name: string): Promise<unknown> => this.http.post("/configs/geo", { name }),
    restart: (): Promise<unknown> => this.http.post("/restart", undefined),
  };

  readonly proxy = {
    list: (): Promise<ProxyMap> => this.http.get("/proxies"),
    get: (name: string): Promise<ProxyInfo> =>
      this.http.get(`/proxies/${encodeURIComponent(name)}`),
    select: (group: string, name: string): Promise<unknown> =>
      this.http.put(`/proxies/${encodeURIComponent(group)}`, { name }),
    delay: (
      name: string,
      url = "https://www.gstatic.com/generate_204",
      timeout = 5000
    ): Promise<unknown> => {
      const path = `/proxies/${encodeURIComponent(name)}/delay?url=${encodeURIComponent(url)}&timeout=${timeout}`;
      return this.http.get(path);
    },
    groupDelay: (
      name: string,
      timeout = 5000,
      url = "https://www.gstatic.com/generate_204"
    ): Promise<unknown> => {
      const path = `/group/${encodeURIComponent(name)}/delay?timeout=${timeout}&url=${encodeURIComponent(url)}`;
      return this.http.get(path);
    },
  };

  readonly providers = {
    proxies: {
      list: (): Promise<unknown> => this.http.get("/providers/proxies"),
      update: (name: string): Promise<unknown> =>
        this.http.put(`/providers/proxies/${encodeURIComponent(name)}`),
      healthCheck: (name: string): Promise<unknown> =>
        this.http.get(`/providers/proxies/${encodeURIComponent(name)}/healthcheck`),
    },
    rules: {
      list: (): Promise<unknown> => this.http.get("/providers/rules"),
      update: (name: string): Promise<unknown> =>
        this.http.put(`/providers/rules/${encodeURIComponent(name)}`),
    },
  };

  readonly rules = {
    list: (): Promise<RulesResponse> => this.http.get("/rules"),
  };

  readonly connections = {
    list: (): Promise<unknown> => this.http.get("/connections"),
    close: (id: string): Promise<unknown> =>
      this.http.delete(`/connections/${id}`),
    closeAll: (): Promise<unknown> => this.http.delete("/connections"),
  };

  readonly dns = {
    query: (name: string, type = "A"): Promise<DNSResponse> => {
      const path = `/dns/query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
      return this.http.get(path);
    },
  };

  readonly cache = {
    flushFakeIP: (): Promise<unknown> => this.http.post("/cache/fakeip/flush"),
    fakeIPCount: (): Promise<{ count: number }> => this.http.get("/cache/fakeip/count"),
  };

  readonly upgrade = {
    check: (): Promise<unknown> => this.http.post("/upgrade", undefined),
    status: (): Promise<unknown> => this.http.get("/upgrade/status"),
  };

  readonly subscriptions = {
    list: (): Promise<unknown> => this.http.get("/subscriptions"),
    update: (name: string): Promise<unknown> =>
      this.http.put(`/subscriptions/${encodeURIComponent(name)}`, undefined),
    updateAll: (): Promise<unknown> => this.http.post("/subscriptions", undefined),
  };
}
