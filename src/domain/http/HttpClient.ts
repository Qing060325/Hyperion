export class HttpClientError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public endpoint?: string,
    public method?: string
  ) {
    super(message);
    this.name = "HttpClientError";
  }

  get isTimeout() {
    return this.status === 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      endpoint: this.endpoint,
      method: this.method,
    };
  }
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  onError?: (err: HttpClientError) => void;
}

export class HttpClient<T = unknown> {
  public baseURL: string;
  public timeout: number;
  public retries: number;
  public onError?: (err: HttpClientError) => void;

  constructor(options: HttpClientOptions = {}) {
    const { baseURL = "http://127.0.0.1:9090", timeout = 8000, retries = 0, onError } = options;
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.retries = retries;
    this.onError = onError;
  }

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  setTimeout(ms: number) {
    this.timeout = ms;
  }

  setRetries(n: number) {
    this.retries = n;
  }

  setOnError(fn: (err: HttpClientError) => void) {
    this.onError = fn;
  }

  private buildURL(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const base = this.baseURL.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return base + p;
  }

  private readTokenFromStorage(): string | null {
    try {
      const raw = localStorage.getItem("hyperion-connection");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.secret === "string" && obj.secret.length > 0) return obj.secret;
      }
    } catch {
      // ignore
    }
    return null;
  }

  private emitError(err: HttpClientError) {
    if (this.onError) {
      this.onError(err);
    }
  }

  private async request<U = T>(
    path: string,
    init: RequestInit = {},
    attempt = 0
  ): Promise<U> {
    const url = this.buildURL(path);
    const method = (init.method || "GET").toUpperCase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const token = this.readTokenFromStorage();
      const headers: Record<string, string> = {
        ...(init.headers ?? {} as Record<string, string>),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok && attempt < this.retries) {
        clearTimeout(timer);
        const delay = Math.min(500 * Math.pow(2, attempt), 4000);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<U>(path, init, attempt + 1);
      }

      if (!res.ok) {
        const err = new HttpClientError(
          `HTTP ${res.status} ${res.statusText}`,
          res.status,
          url,
          method
        );
        this.emitError(err);
        throw err;
      }

      const contentType = (res.headers.get("Content-Type") || "").toLowerCase();
      if (contentType.includes("application/json")) {
        return res.json() as Promise<U>;
      }
      return res.text() as Promise<U>;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof HttpClientError) {
        this.emitError(err);
        throw err;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        const error = new HttpClientError(
          `Request timed out after ${this.timeout}ms`,
          0,
          url,
          method
        );
        this.emitError(error);
        throw error;
      }
      const error = new HttpClientError(
        (err as Error).message || "Unknown error",
        undefined,
        url,
        method
      );
      this.emitError(error);
      throw error;
    }
  }

  async get<Res = T>(path: string, headers?: Record<string, string>): Promise<Res> {
    return this.request<Res>(path, { method: "GET", headers });
  }

  async post<Res = T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<Res> {
    return this.request<Res>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<Res = T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<Res> {
    return this.request<Res>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<Res = T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<Res> {
    return this.request<Res>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<Res = T>(path: string, headers?: Record<string, string>): Promise<Res> {
    return this.request<Res>(path, { method: "DELETE", headers });
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
