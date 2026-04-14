import { createSignal, createEffect, Show } from "solid-js";
import { useThemeStore } from "@/stores/theme";
import { useClashStore } from "@/stores/clash";
import { Sun, Moon, Monitor, Check, Link2, Unlink } from "lucide-solid";

type Theme = "light" | "dark" | "system";

export default function Settings() {
  const themeStore = useThemeStore();
  const clash = useClashStore();

  const [language, setLanguage] = createSignal("zh-CN");
  const [autoStart, setAutoStart] = createSignal(false);
  const [silentStart, setSilentStart] = createSignal(false);
  const [host, setHost] = createSignal("127.0.0.1");
  const [port, setPort] = createSignal(9090);
  const [secret, setSecret] = createSignal("");
  const [systemProxy, setSystemProxy] = createSignal(false);
  const [tunMode, setTunMode] = createSignal(false);
  const [allowLan, setAllowLan] = createSignal(true);
  const [logLevel, setLogLevel] = createSignal("info");

  const [useProxy, setUseProxy] = createSignal(clash.connection().useProxy);
  const [saving, setSaving] = createSignal(false);
  const [saveOk, setSaveOk] = createSignal(false);

  createEffect(() => {
    if (clash.config()) {
      setHost(clash.config()?.["external-controller"]?.split(":")[0] || "127.0.0.1");
      setPort(parseInt(clash.config()?.["external-controller"]?.split(":")[1]) || 9090);
      setAllowLan(clash.config()?.["allow-lan"] || false);
      setLogLevel(clash.config()?.["log-level"] || "info");
      setSystemProxy(clash.config()?.tun?.enable || false);
      setUseProxy(clash.connection().useProxy);
    }
  });

  const saveConnection = async () => {
    setSaving(true);
    setSaveOk(false);
    const ok = await clash.updateConnection({
      host: host(),
      port: port(),
      secret: secret(),
      useProxy: useProxy(),
    });
    setSaving(false);
    if (ok) {
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    }
  };

  const setMode = async (mode: string) => {
    try {
      await fetch(`${clash.baseUrl()}/configs`, {
        method: "PATCH",
        headers: clash.headers(),
        body: JSON.stringify({ mode }),
      });
    } catch (e) { console.error(e) }
  };

  const themeOptions: { value: Theme; label: string; icon: any }[] = [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "跟随系统", icon: Monitor },
  ];

  return (
    <div class="animate-page-in space-y-6 max-w-2xl">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">设置</h1>
        <p class="text-sm text-base-content/50 mt-0.5">应用与网络配置</p>
      </div>

      {/* General */}
      <div class="card bg-base-100 animate-card-in stagger-1">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">通用</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="语言">
            <select class="select select-sm select-bordered rounded-xl w-32" value={language()} onChange={(e) => setLanguage(e.currentTarget.value)}>
              <option value="zh-CN">中文</option>
              <option value="en">English</option>
            </select>
          </SettingRow>
          <SettingRow label="开机自启" desc="系统启动时自动运行">
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={autoStart()} onChange={() => setAutoStart(!autoStart())} />
            </label>
          </SettingRow>
          <SettingRow label="静默启动" desc="启动时最小化到托盘">
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={silentStart()} onChange={() => setSilentStart(!silentStart())} />
            </label>
          </SettingRow>
        </div>
      </div>

      {/* Connection */}
      <div class="card bg-base-100 animate-card-in stagger-2">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">连接</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="代理模式" desc={useProxy() ? "通过 Nginx 反代访问 Clash API" : "直连 Clash API（适用于 Termux / 本地运行）"}>
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={useProxy()} onChange={() => setUseProxy(!useProxy())} />
            </label>
          </SettingRow>
          <Show when={!useProxy()}>
            <SettingRow label="API 地址" desc="Clash external-controller 地址">
              <input class="input input-bordered input-sm w-36 rounded-xl" value={host()} onInput={(e) => setHost(e.currentTarget.value)} />
            </SettingRow>
            <SettingRow label="端口">
              <input class="input input-bordered input-sm w-24 rounded-xl" type="number" value={port()} onInput={(e) => setPort(parseInt(e.currentTarget.value))} />
            </SettingRow>
            <SettingRow label="密钥">
              <input class="input input-bordered input-sm w-48 rounded-xl" type="password" placeholder="可选" value={secret()} onInput={(e) => setSecret(e.currentTarget.value)} />
            </SettingRow>
          </Show>
          <div class="px-4 py-3">
            <button
              class={`btn btn-sm rounded-xl w-full gap-1.5 ${
                saveOk() ? "btn-success" : "btn-primary"
              } ${saving() ? "loading" : ""}`}
              onClick={saveConnection}
            >
              {saveOk() ? <Check size={14} /> : <Link2 size={14} />}
              {saveOk() ? "连接成功" : "保存并连接"}
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div class="card bg-base-100 animate-card-in stagger-3">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">外观</span>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = themeStore.theme() === opt.value;
              return (
                <button
                  class={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-base-300 bg-base-200/30 hover:border-base-content/20"
                  }`}
                  onClick={() => themeStore.change(opt.value)}
                >
                  <Icon size={20} class={isActive ? "text-primary" : "text-base-content/50"} />
                  <span class={`text-xs font-medium ${isActive ? "text-primary" : "text-base-content/60"}`}>
                    {opt.label}
                  </span>
                  {isActive && <Check size={14} class="text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network */}
      <div class="card bg-base-100 animate-card-in stagger-4">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">网络</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="系统代理" desc="将系统流量转发到 Clash">
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={systemProxy()} onChange={() => setSystemProxy(!systemProxy())} />
            </label>
          </SettingRow>
          <SettingRow label="TUN 模式" desc="透明代理，接管所有流量">
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={tunMode()} onChange={() => setTunMode(!tunMode())} />
            </label>
          </SettingRow>
          <SettingRow label="允许局域网" desc="接受来自局域网的连接">
            <label class="toggle toggle-sm toggle-primary">
              <input type="checkbox" checked={allowLan()} onChange={() => setAllowLan(!allowLan())} />
            </label>
          </SettingRow>
          <SettingRow label="运行模式">
            <div class="join">
              {(["rule", "global", "direct"] as const).map((m) => (
                <button
                  class={`btn btn-xs join-item rounded-none ${clash.config()?.mode === m ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setMode(m)}
                >
                  {m === "rule" ? "规则" : m === "global" ? "全局" : "直连"}
                </button>
              ))}
            </div>
          </SettingRow>
          <SettingRow label="日志级别">
            <select class="select select-sm select-bordered rounded-xl w-28" value={logLevel()} onChange={(e) => setLogLevel(e.currentTarget.value)}>
              <option value="silent">Silent</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* About */}
      <div class="card bg-base-100 animate-card-in stagger-5">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">关于</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="Hyperion 版本">
            <span class="badge badge-sm badge-ghost font-mono">v0.3.0</span>
          </SettingRow>
          <SettingRow label="Clash Meta 版本">
            <span class="badge badge-sm badge-ghost font-mono">{clash.version()?.version || "-"}</span>
          </SettingRow>
          <SettingRow label="架构">
            <span class="text-sm text-base-content/60">SolidJS + DaisyUI + TypeScript</span>
          </SettingRow>
        </div>
        <div class="p-4 text-xs text-base-content/30 text-center">
          Hyperion — 以光明之名，掌控网络之流
        </div>
      </div>
    </div>
  );
}

function SettingRow(props: { label: string; desc?: string; children: any }) {
  return (
    <div class="flex items-center justify-between px-4 py-3">
      <div class="mr-4">
        <span class="text-sm font-medium">{props.label}</span>
        {props.desc && <p class="text-xs text-base-content/40 mt-0.5">{props.desc}</p>}
      </div>
      {props.children}
    </div>
  );
}
