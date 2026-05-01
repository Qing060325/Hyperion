import { createSignal, createEffect, Show } from "solid-js";
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader } from "lucide-solid";
import { VersionInfo } from "@/types/hades-api";

interface KernelStatus {
  installed: boolean;
  version: string;
  buildTime: string;
  goVersion: string;
  lastChecked: Date;
}

export default function HadesKernelManager() {
  const [kernelStatus, setKernelStatus] = createSignal<KernelStatus | null>(null);
  const [isInstalling, setIsInstalling] = createSignal(false);
  const [installError, setInstallError] = createSignal<string | null>(null);
  const [installSuccess, setInstallSuccess] = createSignal(false);
  const [installProgress, setInstallProgress] = createSignal(0);

  // 检测 Hades 内核状态
  const checkKernelStatus = async () => {
    try {
      const response = await fetch("http://localhost:9090/version");
      if (response.ok) {
        const data: VersionInfo = await response.json();
        setKernelStatus({
          installed: true,
          version: data.version,
          buildTime: data.buildTime,
          goVersion: data.goVersion,
          lastChecked: new Date(),
        });
        setInstallError(null);
      } else {
        setKernelStatus({
          installed: false,
          version: "",
          buildTime: "",
          goVersion: "",
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      setKernelStatus({
        installed: false,
        version: "",
        buildTime: "",
        goVersion: "",
        lastChecked: new Date(),
      });
    }
  };

  // 初始化时检查内核状态
  createEffect(() => {
    checkKernelStatus();
    // 每 30 秒检查一次
    const interval = setInterval(checkKernelStatus, 30000);
    return () => clearInterval(interval);
  });

  // 触发内核安装
  const handleInstallKernel = async () => {
    setIsInstalling(true);
    setInstallError(null);
    setInstallSuccess(false);
    setInstallProgress(0);

    try {
      // 显示安装进度
      setInstallProgress(25);

      // 调用安装 API（这里假设后端提供了安装端点）
      const response = await fetch("http://localhost:9090/admin/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "install",
          version: "latest",
        }),
      });

      setInstallProgress(50);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "安装失败");
      }

      setInstallProgress(75);

      // 等待 2 秒后重新检查状态
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await checkKernelStatus();

      setInstallProgress(100);
      setInstallSuccess(true);

      // 3 秒后隐藏成功提示
      setTimeout(() => setInstallSuccess(false), 3000);
    } catch (error) {
      console.error("安装失败:", error);
      setInstallError(
        error instanceof Error ? error.message : "安装过程中出错，请检查日志"
      );
    } finally {
      setIsInstalling(false);
      setInstallProgress(0);
    }
  };

  // 触发内核更新
  const handleUpdateKernel = async () => {
    setIsInstalling(true);
    setInstallError(null);
    setInstallSuccess(false);
    setInstallProgress(0);

    try {
      setInstallProgress(25);

      const response = await fetch("http://localhost:9090/admin/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upgrade",
        }),
      });

      setInstallProgress(50);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "更新失败");
      }

      setInstallProgress(75);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await checkKernelStatus();

      setInstallProgress(100);
      setInstallSuccess(true);

      setTimeout(() => setInstallSuccess(false), 3000);
    } catch (error) {
      console.error("更新失败:", error);
      setInstallError(
        error instanceof Error ? error.message : "更新过程中出错，请检查日志"
      );
    } finally {
      setIsInstalling(false);
      setInstallProgress(0);
    }
  };

  return (
    <div class="card bg-base-100 shadow-lg border border-base-300">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="card-title text-lg">Hades 内核管理</h2>
            <p class="text-sm text-base-content/60 mt-1">
              安装或更新高性能代理内核
            </p>
          </div>
          <div class="text-3xl">🔱</div>
        </div>

        {/* 内核状态显示 */}
        <Show
          when={kernelStatus()}
          fallback={
            <div class="py-4 text-center">
              <Loader class="inline animate-spin w-5 h-5" />
              <p class="text-sm text-base-content/60 mt-2">检测中...</p>
            </div>
          }
        >
          {(status) => (
            <div class="mt-4 space-y-3">
              <Show when={status().installed}>
                <div class="alert alert-success">
                  <CheckCircle class="w-5 h-5" />
                  <div>
                    <h3 class="font-semibold">内核已安装</h3>
                    <div class="text-sm mt-1 space-y-1">
                      <p>
                        <span class="font-medium">版本:</span> {status().version}
                      </p>
                      <p>
                        <span class="font-medium">Go 版本:</span>{" "}
                        {status().goVersion}
                      </p>
                      <p>
                        <span class="font-medium">构建时间:</span>{" "}
                        {status().buildTime || "未知"}
                      </p>
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={!status().installed}>
                <div class="alert alert-warning">
                  <AlertCircle class="w-5 h-5" />
                  <div>
                    <h3 class="font-semibold">内核未安装</h3>
                    <p class="text-sm mt-1">
                      请安装 Hades 内核以启用完整功能
                    </p>
                  </div>
                </div>
              </Show>
            </div>
          )}
        </Show>

        {/* 错误提示 */}
        <Show when={installError()}>
          <div class="alert alert-error mt-4">
            <AlertCircle class="w-5 h-5" />
            <span>{installError()}</span>
          </div>
        </Show>

        {/* 成功提示 */}
        <Show when={installSuccess()}>
          <div class="alert alert-success mt-4">
            <CheckCircle class="w-5 h-5" />
            <span>
              {kernelStatus()?.installed ? "内核更新成功" : "内核安装成功"}
            </span>
          </div>
        </Show>

        {/* 安装进度条 */}
        <Show when={isInstalling()}>
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">安装进度</span>
              <span class="text-sm text-base-content/60">
                {installProgress()}%
              </span>
            </div>
            <progress
              class="progress progress-primary w-full"
              value={installProgress()}
              max="100"
            ></progress>
          </div>
        </Show>

        {/* 操作按钮 */}
        <div class="flex gap-3 mt-6">
          <Show
            when={kernelStatus()?.installed}
            fallback={
              <button
                class="btn btn-primary flex-1 gap-2"
                disabled={isInstalling()}
                onClick={handleInstallKernel}
              >
                <Show when={!isInstalling()} fallback={<Loader class="w-4 h-4 animate-spin" />}>
                  <Download class="w-4 h-4" />
                </Show>
                安装内核
              </button>
            }
          >
            <button
              class="btn btn-primary flex-1 gap-2"
              disabled={isInstalling()}
              onClick={handleUpdateKernel}
            >
              <Show when={!isInstalling()} fallback={<Loader class="w-4 h-4 animate-spin" />}>
                <RefreshCw class="w-4 h-4" />
              </Show>
              更新内核
            </button>
          </Show>

          <button
            class="btn btn-ghost gap-2"
            disabled={isInstalling()}
            onClick={checkKernelStatus}
          >
            <RefreshCw class="w-4 h-4" />
            刷新
          </button>
        </div>

        {/* 帮助文本 */}
        <div class="mt-4 p-3 bg-base-200 rounded-lg text-sm text-base-content/70">
          <p class="font-medium mb-1">💡 提示:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>首次安装可能需要 2-3 分钟</li>
            <li>安装过程中请勿关闭此页面</li>
            <li>更新内核不会影响现有配置</li>
            <li>如安装失败，请查看系统日志</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
