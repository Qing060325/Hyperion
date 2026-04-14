import { createSignal, createEffect, Show } from "solid-js";
import { useThemeStore } from "@/stores/theme";
import { useClashStore } from "@/stores/clash";
import { useSettingsStore } from "@/stores/settings";
import { Sun, Moon, Monitor, Check, Link2, Unlink, Download, RefreshCw, AlertCircle } from "lucide-solid";
import ripple from "@/components/ui/RippleEffect";

type Theme = "light" | "dark" | "system";

export default function Settings() {
  const themeStore = useThemeStore();
  const clash = useClashStore();
  const settingsStore = useSettingsStore();

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
    <div class="animate-page-in-enhanced space-y-6 max-w-2xl">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">设置</h1>
        <p class="text-sm text-base-content/50 mt-0.5">应用与网络配置</p>
      </div>

      {/* General */}
      <div class="card bg-base-100 animate-card-spring stagger-1">
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
      <div class="card bg-base-100 animate-card-spring stagger-2">
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
              use:ripple
              class={`btn btn-sm rounded-xl w-full gap-1.5 ${
                saveOk() ? "btn-success animate-success-flash" : "btn-primary"
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
      <div class="card bg-base-100 animate-card-spring stagger-3">
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
                  use:ripple
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

        {/* Sakura Skin Toggle */}
        <div class="divide-y divide-base-200/50">
          <SettingRow label="樱花特效" desc="开启飘落樱花粒子动画">
            <label class="toggle toggle-sm toggle-primary">
              <input
                type="checkbox"
                checked={settingsStore.settings().sakura_skin}
                onChange={() => settingsStore.updateSettings({ sakura_skin: !settingsStore.settings().sakura_skin })}
              />
            </label>
          </SettingRow>
        </div>
      </div>

      {/* Network */}
      <div class="card bg-base-100 animate-card-spring stagger-4">
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
                  use:ripple
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

      {/* System Upgrade */}
      <SystemUpgrade clash={clash} />

      {/* About */}
      <div class="card bg-base-100 animate-card-spring stagger-5">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">关于</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="Hyperion 版本">
            <span class="badge badge-sm badge-ghost font-mono">v0.4.0</span>
          </SettingRow>
          <SettingRow label="Hades 版本">
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

// SystemUpgrade 系统升级组件
function SystemUpgrade(props: { clash: any }) {
  const [checking, setChecking] = createSignal(false);
  const [upgrading, setUpgrading] = createSignal(false);
  const [upgradeStatus, setUpgradeStatus] = createSignal<{
    status: string;
    message: string;
    progress: number;
    current?: string;
    latest?: string;
  } | null>(null);
  const [showModal, setShowModal] = createSignal(false);

  // 检查更新
  const checkUpgrade = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${props.clash.baseUrl()}/upgrade`, {
        method: "POST",
        headers: props.clash.headers(),
      });

      if (res.ok) {
        const data = await res.json();
        setUpgradeStatus({
          status: data.need_upgrade ? "downloading" : "idle",
          message: data.message,
          progress: 0,
          current: data.current,
          latest: data.latest,
        });
        setShowModal(true);

        if (data.need_upgrade) {
          setUpgrading(true);
          // 开始轮询状态
          pollUpgradeStatus();
        }
      } else {
        const error = await res.json();
        alert(`检查更新失败: ${error.error || "未知错误"}`);
      }
    } catch (e) {
      console.error("检查更新失败:", e);
      alert("检查更新失败，请检查网络连接");
    }
    setChecking(false);
  };

  // 轮询升级状态
  const pollUpgradeStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${props.clash.baseUrl()}/upgrade/status`, {
          headers: props.clash.headers(),
        });

        if (res.ok) {
          const data = await res.json();
          setUpgradeStatus(data);

          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            setUpgrading(false);
          }
        }
      } catch (e) {
        console.error("获取升级状态失败:", e);
      }
    }, 2000);

    // 30秒后自动停止轮询
    setTimeout(() => clearInterval(interval), 30000);
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "failed":
        return "text-error";
      case "downloading":
      case "installing":
        return "text-primary";
      default:
        return "text-base-content/60";
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check class="w-5 h-5 text-success" />;
      case "failed":
        return <AlertCircle class="w-5 h-5 text-error" />;
      case "downloading":
      case "installing":
        return <RefreshCw class="w-5 h-5 animate-spin text-primary" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div class="card bg-base-100 animate-card-spring stagger-4">
        <div class="px-4 pt-4 pb-2">
          <span class="text-xs font-semibold text-base-content/40 uppercase tracking-wider">系统</span>
        </div>
        <div class="divide-y divide-base-200/50">
          <SettingRow label="Hades 内核升级" desc="检查并安装最新版本">
            <button
              use:ripple
              class={`btn btn-sm rounded-xl gap-1.5 ${upgrading() ? "btn-disabled" : "btn-outline btn-primary"}`}
              onClick={checkUpgrade}
              disabled={upgrading()}
            >
              {checking() ? (
                <RefreshCw class="w-4 h-4 animate-spin" />
              ) : upgrading() ? (
                <RefreshCw class="w-4 h-4 animate-spin" />
              ) : (
                <Download class="w-4 h-4" />
              )}
              {checking() ? "检查中..." : upgrading() ? "升级中..." : "检查更新"}
            </button>
          </SettingRow>
        </div>
      </div>

      {/* 升级状态弹窗 */}
      <Show when={showModal()}>
        <div class="modal modal-open animate-modal-backdrop">
          <div class="modal-box max-w-md animate-modal-content">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold">系统升级</h3>
              <button
                use:ripple
                class="btn btn-ghost btn-sm btn-circle"
                onClick={() => setShowModal(false)}
                disabled={upgrading()}
              >
                <span class="text-lg">×</span>
              </button>
            </div>

            <Show when={upgradeStatus()}>
              {(status) => (
                <div class="space-y-4">
                  {/* 版本信息 */}
                  <Show when={status().current && status().latest}>
                    <div class="flex items-center justify-between bg-base-200 rounded-lg p-3">
                      <div>
                        <div class="text-xs text-base-content/60">当前版本</div>
                        <div class="font-mono font-medium">{status().current}</div>
                      </div>
                      <div class="text-2xl text-base-content/30">→</div>
                      <div class="text-right">
                        <div class="text-xs text-base-content/60">最新版本</div>
                        <div class="font-mono font-medium text-primary">{status().latest}</div>
                      </div>
                    </div>
                  </Show>

                  {/* 状态显示 */}
                  <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                    {getStatusIcon(status().status)}
                    <div class="flex-1">
                      <div class={`font-medium ${getStatusColor(status().status)}`}>
                        {status().message}
                      </div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <Show when={status().status === "downloading" || status().status === "installing"}>
                    <div>
                      <div class="flex justify-between text-sm mb-1">
                        <span>升级进度</span>
                        <span>{status().progress}%</span>
                      </div>
                      <div class="w-full bg-base-300 rounded-full h-2">
                        <div
                          class="h-2 rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${status().progress}%` }}
                        />
                      </div>
                    </div>
                  </Show>

                  {/* 重启提示 */}
                  <Show when={status().status === "completed"}>
                    <div class="alert alert-success">
                      <Check class="w-5 h-5" />
                      <span>升级完成！请重启 Hades 服务以应用新版本。</span>
                    </div>
                  </Show>

                  {/* 错误提示 */}
                  <Show when={status().status === "failed"}>
                    <div class="alert alert-error">
                      <AlertCircle class="w-5 h-5" />
                      <span>升级失败，请稍后重试或手动升级。</span>
                    </div>
                  </Show>
                </div>
              )}
            </Show>

            <div class="modal-action">
              <button
                use:ripple
                class="btn btn-ghost"
                onClick={() => setShowModal(false)}
                disabled={upgrading()}
              >
                {upgrading() ? "升级中..." : "关闭"}
              </button>
              <Show when={upgradeStatus()?.status === "completed"}>
                <button
                  use:ripple
                  class="btn btn-primary"
                  onClick={() => {
                    alert("请手动重启 Hades 服务以完成升级");
                    setShowModal(false);
                  }}
                >
                  我知道了
                </button>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
