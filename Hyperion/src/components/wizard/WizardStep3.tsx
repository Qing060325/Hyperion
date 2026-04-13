// ==========================================
// WizardStep3 - Configure Connection
// ==========================================

import { createSignal, Show } from "solid-js";
import { Server, Key, Loader2, Check, AlertCircle } from "lucide-solid";
import { useWizardStore } from "../../stores/wizard";
import { useClashDetector } from "../../hooks/useClashDetector";

interface WizardStep3Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function WizardStep3(props: WizardStep3Props) {
  const wizard = useWizardStore();
  const detector = useClashDetector();
  
  const [testing, setTesting] = createSignal(false);
  const [testSuccess, setTestSuccess] = createSignal<boolean | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestSuccess(null);
    
    const config = wizard.state().connectionConfig;
    const result = await detector.testConnection(config);
    
    setTestSuccess(!!result);
    setTesting(false);
  };

  const handleNext = () => {
    if (testSuccess()) {
      props.onNext();
    } else {
      handleTest();
    }
  };

  return (
    <div>
      <h2 class="text-2xl font-bold mb-2 text-center">配置连接</h2>
      <p class="text-base-content/70 mb-8 text-center">
        配置 Clash API 连接参数
      </p>

      <div class="space-y-6 max-w-md mx-auto">
        {/* API Host */}
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Server class="w-4 h-4" />
              API 地址
            </span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full"
            placeholder="127.0.0.1"
            value={wizard.state().connectionConfig.host}
            onInput={(e) => wizard.setConnectionConfig({ host: e.currentTarget.value })}
          />
        </div>

        {/* API Port */}
        <div class="form-control">
          <label class="label">
            <span class="label-text">API 端口</span>
          </label>
          <input
            type="number"
            class="input input-bordered w-full"
            placeholder="9090"
            value={wizard.state().connectionConfig.port}
            onInput={(e) => wizard.setConnectionConfig({ port: parseInt(e.currentTarget.value) || 9090 })}
          />
        </div>

        {/* API Secret */}
        <div class="form-control">
          <label class="label">
            <span class="label-text flex items-center gap-2">
              <Key class="w-4 h-4" />
              API 密钥 (可选)
            </span>
          </label>
          <input
            type="password"
            class="input input-bordered w-full"
            placeholder="留空表示无密钥"
            value={wizard.state().connectionConfig.secret || ''}
            onInput={(e) => wizard.setConnectionConfig({ secret: e.currentTarget.value })}
          />
        </div>

        {/* Test result */}
        <Show when={testSuccess() !== null}>
          <div class={`alert ${testSuccess() ? 'alert-success' : 'alert-error'}`}>
            {testSuccess() ? (
              <>
                <Check class="w-5 h-5" />
                <span>连接成功</span>
              </>
            ) : (
              <>
                <AlertCircle class="w-5 h-5" />
                <span>连接失败，请检查配置</span>
              </>
            )}
          </div>
        </Show>

        {/* Actions */}
        <div class="flex gap-3 pt-4">
          <button class="btn btn-outline flex-1" onClick={props.onPrev}>
            上一步
          </button>
          <button 
            class="btn btn-outline flex-1" 
            onClick={handleTest}
            disabled={testing()}
          >
            {testing() ? (
              <Loader2 class="w-4 h-4 animate-spin" />
            ) : (
              '测试连接'
            )}
          </button>
          <button 
            class="btn btn-primary flex-1" 
            onClick={handleNext}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
