// ==========================================
// RuleEditorPage - Visual Rule Editor
// ==========================================

import { createSignal, onMount, Show } from "solid-js";
import { ArrowLeft, Save, AlertTriangle } from "lucide-solid";
import { useNavigate } from "@solidjs/router";
import RuleEditor from "../components/rules/RuleEditor";
import type { RuleFormData } from "../types/rule-editor";
import { parseRulesString, validateRules } from "../components/rules/RuleValidator";
import ripple from "@/components/ui/RippleEffect";
import { clashApi } from "../services/clash-api";

export default function RuleEditorPage() {
  const navigate = useNavigate();
  const [rules, setRules] = createSignal<RuleFormData[]>([]);
  const [proxies, setProxies] = createSignal<string[]>(['DIRECT', 'REJECT', 'GLOBAL']);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      // Load current rules from Clash
      const rulesData = await clashApi.getRules();
      const parsedRules = rulesData.rules.map((r, i) => ({
        id: `rule-${i}`,
        type: r.type as any,
        payload: r.payload,
        proxy: r.proxy,
        enabled: true,
      }));
      setRules(parsedRules);

      // Load available proxies
      const proxyMap = await clashApi.getProxies();
      const proxyNames = Object.keys(proxyMap);
      setProxies(['DIRECT', 'REJECT', 'GLOBAL', ...proxyNames]);
    } catch (err) {
      setError('无法加载规则数据');
    } finally {
      setLoading(false);
    }
  });

  const handleSave = async (newRules: RuleFormData[]) => {
    setSaving(true);
    setError(null);

    try {
      // Validate rules
      const validationResults = validateRules(newRules);
      const hasErrors = Array.from(validationResults.values()).some(r => !r.valid);
      
      if (hasErrors) {
        setError('部分规则存在错误，请检查后再保存');
        return;
      }

      // Convert to YAML format and save
      // Note: This requires backend support to actually modify the config file
      // For now, we just update the local state
      setRules(newRules);
      
      // Show success message
      alert('规则已保存');
    } catch (err) {
      setError('保存失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/rules');
  };

  return (
    <div class="animate-page-in-enhanced space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div class="flex items-center gap-4">
        <button use:ripple class="btn btn-ghost btn-sm btn-circle" onClick={handleCancel}>
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold">规则编辑器</h1>
          <p class="text-base-content/50 text-sm">
            可视化编辑 Clash 规则
          </p>
        </div>
      </div>

      {/* Error alert */}
      <Show when={error()}>
        <div class="alert alert-error">
          <AlertTriangle class="w-5 h-5" />
          <span>{error()}</span>
        </div>
      </Show>

      {/* Loading */}
      <Show when={loading()}>
        <div class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </Show>

      {/* Editor */}
      <Show when={!loading()}>
        <div class="card bg-base-100 shadow-lg border border-base-300 flex-1 overflow-hidden animate-card-spring">
          <div class="card-body p-6 h-full">
            <RuleEditor
              rules={rules()}
              proxies={proxies()}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </Show>

      {/* Saving overlay */}
      <Show when={saving()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50">
          <div class="flex items-center gap-3">
            <span class="loading loading-spinner loading-md text-primary"></span>
            <span>保存中...</span>
          </div>
        </div>
      </Show>
    </div>
  );
}
