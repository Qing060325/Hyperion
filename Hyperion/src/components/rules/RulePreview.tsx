// ==========================================
// RulePreview - YAML Preview
// ==========================================

import { For, Show } from "solid-js";
import { X, Copy, Check, Download } from "lucide-solid";
import type { RuleFormData } from "../../types/rule-editor";
import { createSignal } from "solid-js";

interface RulePreviewProps {
  rules: RuleFormData[];
  onClose: () => void;
}

export default function RulePreview(props: RulePreviewProps) {
  const [copied, setCopied] = createSignal(false);

  const yaml = () => {
    const lines = props.rules
      .filter(r => r.enabled !== false)
      .map(r => {
        let line = `${r.type},${r.payload},${r.proxy}`;
        if (r.noResolve) line += ',no-resolve';
        return `  - ${line}`;
      });
    return `rules:\n${lines.join('\n')}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yaml()], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">规则预览</h3>
        <div class="flex gap-2">
          <button 
            class="btn btn-sm btn-ghost gap-1"
            onClick={handleCopy}
          >
            {copied() ? <Check class="w-4 h-4" /> : <Copy class="w-4 h-4" />}
            {copied() ? '已复制' : '复制'}
          </button>
          <button 
            class="btn btn-sm btn-ghost gap-1"
            onClick={handleDownload}
          >
            <Download class="w-4 h-4" />
            下载
          </button>
          <button class="btn btn-sm btn-ghost btn-circle" onClick={props.onClose}>
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="stats shadow bg-base-200 mb-4">
        <div class="stat">
          <div class="stat-title">总规则数</div>
          <div class="stat-value text-primary">{props.rules.length}</div>
        </div>
        <div class="stat">
          <div class="stat-title">已启用</div>
          <div class="stat-value text-success">{props.rules.filter(r => r.enabled !== false).length}</div>
        </div>
        <div class="stat">
          <div class="stat-title">已禁用</div>
          <div class="stat-value text-base-content/50">{props.rules.filter(r => r.enabled === false).length}</div>
        </div>
      </div>

      <pre class="bg-base-300 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
        <code>{yaml()}</code>
      </pre>
    </div>
  );
}
