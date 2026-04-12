import { createSignal } from "solid-js";
import { clashApi } from "../services/clash-api";
import { useI18n } from "../i18n";
import type { DNSQueryResult } from "../types/clash";

export default function DNS() {
  const { t } = useI18n();
  const [queryDomain, setQueryDomain] = createSignal("");
  const [queryType, setQueryType] = createSignal("A");
  const [queryResult, setQueryResult] = createSignal<DNSQueryResult | null>(null);
  const [querying, setQuerying] = createSignal(false);
  const [flushing, setFlushing] = createSignal(false);

  const dnsQuery = async () => {
    if (!queryDomain()) return;
    try {
      setQuerying(true);
      const result = await clashApi.dnsQuery(queryDomain(), queryType());
      setQueryResult(result);
    } catch (e) {
      console.error("DNS query failed:", e);
    } finally {
      setQuerying(false);
    }
  };

  const flushFakeIP = async () => {
    try {
      setFlushing(true);
      await clashApi.flushFakeIP();
    } catch (e) {
      console.error("Failed to flush:", e);
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div class="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1 class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          DNS
        </h1>
        <p class="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          DNS query and cache management
        </p>
      </div>

      {/* DNS Query */}
      <div class="rounded-xl p-4 neon-border" style={{ background: "var(--bg-secondary)" }}>
        <h3 class="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          DNS Query
        </h3>
        <div class="flex gap-2">
          <input
            class="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
            placeholder="example.com"
            value={queryDomain()}
            onInput={(e) => setQueryDomain(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && dnsQuery()}
          />
          <select
            class="px-3 py-2 rounded-lg text-xs outline-none cursor-pointer"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
            value={queryType()}
            onChange={(e) => setQueryType(e.currentTarget.value)}
          >
            <option value="A">A</option>
            <option value="AAAA">AAAA</option>
            <option value="CNAME">CNAME</option>
            <option value="TXT">TXT</option>
            <option value="MX">MX</option>
            <option value="NS">NS</option>
          </select>
          <button
            class="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
              border: "1px solid rgba(6,182,212,0.3)",
            }}
            onClick={dnsQuery}
            disabled={querying() || !queryDomain()}
          >
            Query
          </button>
        </div>

        {/* Query Result */}
        {queryResult() && (
          <div class="mt-3 p-3 rounded-lg font-mono text-xs" style={{ background: "var(--bg-tertiary)" }}>
            <div class="flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>
              <span>Status: <span style={{ color: queryResult()?.Status === 0 ? "var(--success)" : "var(--error)" }}>
                {queryResult()?.Status === 0 ? "NOERROR" : `ERROR (${queryResult()?.Status})`}
              </span></span>
              {queryResult()?.Answer && queryResult()!.Answer.length > 0 && (
                <div class="mt-2">
                  <span style={{ color: "var(--text-tertiary)" }}>Answers:</span>
                  {queryResult()!.Answer.map((answer, i) => (
                    <div key={i} class="flex items-center gap-2 ml-3 mt-1">
                      <span style={{ color: "var(--accent)" }}>{answer.data}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>[{answer.type}] TTL: {answer.TTL}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FakeIP */}
      <div class="rounded-xl p-4 neon-border" style={{ background: "var(--bg-secondary)" }}>
        <h3 class="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Fake-IP Cache
        </h3>
        <p class="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
          Flush the Fake-IP cache to resolve DNS issues.
        </p>
        <button
          class="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            background: "var(--warning-muted)",
            color: "var(--warning)",
            border: "1px solid rgba(245,158,11,0.3)",
          }}
          onClick={flushFakeIP}
          disabled={flushing()}
        >
          Flush Fake-IP Cache
        </button>
      </div>
    </div>
  );
}
